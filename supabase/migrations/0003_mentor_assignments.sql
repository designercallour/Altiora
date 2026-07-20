-- ============================================================================
-- Migration 0003 — Mentor assignment history + intern notes
-- ============================================================================
-- Additive and idempotent. Safe to run on production.
--
-- Adds:
--   1. internships.notes            — optional free-text note per internship
--   2. public.mentor_assignments    — audit trail of mentor supervision spans
--
-- The CURRENT mentor is still internships.mentor_id (fast, indexed pointer).
-- mentor_assignments records the full history: reassignment closes the open
-- span (sets ended_at) and opens a new one. See ADR-0009.
-- ============================================================================

-- 1. Intern notes --------------------------------------------------------------
alter table public.internships
  add column if not exists notes text;

-- 2. Mentor assignment history ------------------------------------------------
create table if not exists public.mentor_assignments (
  id             uuid primary key default gen_random_uuid(),
  internship_id  uuid not null references public.internships (id) on delete cascade,
  mentor_id      uuid not null references public.users (id)       on delete cascade,
  assigned_by_id uuid references public.users (id)                on delete set null,
  note           text,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists mentor_assignments_internship_idx
  on public.mentor_assignments (internship_id);
create index if not exists mentor_assignments_mentor_idx
  on public.mentor_assignments (mentor_id);
-- At most one OPEN span per internship (the current mentor).
create unique index if not exists mentor_assignments_one_open_key
  on public.mentor_assignments (internship_id)
  where ended_at is null;

-- keep updated_at fresh (reuses the shared trigger fn from schema.sql)
drop trigger if exists set_updated_at on public.mentor_assignments;
create trigger set_updated_at
  before update on public.mentor_assignments
  for each row execute function public.set_updated_at();

-- 3. RLS ----------------------------------------------------------------------
alter table public.mentor_assignments enable row level security;

drop policy if exists "ma_admin_all"     on public.mentor_assignments;
drop policy if exists "ma_mentor_select" on public.mentor_assignments;
drop policy if exists "ma_intern_select" on public.mentor_assignments;

-- Admins manage all assignments.
create policy "ma_admin_all" on public.mentor_assignments for all
  using (public.is_admin()) with check (public.is_admin());

-- A mentor can see spans where they are (or were) the mentor.
create policy "ma_mentor_select" on public.mentor_assignments for select
  using (mentor_id = public.current_app_user_id());

-- An intern can see their own supervision history.
create policy "ma_intern_select" on public.mentor_assignments for select
  using (exists (
    select 1 from public.internships i
    where i.id = mentor_assignments.internship_id
      and i.user_id = public.current_app_user_id()
  ));

-- 4. Backfill an open span for existing internships that already have a mentor
--    but no assignment row yet (so history is complete going forward).
insert into public.mentor_assignments (internship_id, mentor_id, started_at)
select i.id, i.mentor_id, coalesce(i.start_date::timestamptz, i.created_at)
from public.internships i
where i.mentor_id is not null
  and i.deleted_at is null
  and not exists (
    select 1 from public.mentor_assignments ma
    where ma.internship_id = i.id and ma.ended_at is null
  );
