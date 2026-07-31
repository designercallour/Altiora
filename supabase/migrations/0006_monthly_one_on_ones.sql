-- ============================================================================
-- Migration 0006 — Monthly 1-on-1 (mentor ↔ intern monthly meeting notes)
--
-- One documented monthly check-in per intern (internship) per month. The
-- meeting happens outside the platform; this record captures its outcome.
-- Safe + idempotent; run in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.monthly_one_on_ones (
  id               uuid primary key default gen_random_uuid(),
  internship_id    uuid not null references public.internships (id) on delete cascade,
  mentor_id        uuid references public.users (id) on delete set null,          -- authoring mentor (snapshot)
  month            smallint not null check (month between 1 and 12),
  year             int not null,
  strengths        text,
  concerns         text,
  goals_next_month text,
  status           text not null default 'not_started'
                     check (status in ('not_started', 'completed')),
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One record per intern per month.
create unique index if not exists monthly_one_on_ones_period_key
  on public.monthly_one_on_ones (internship_id, year, month);

create index if not exists monthly_one_on_ones_internship_idx
  on public.monthly_one_on_ones (internship_id);

create index if not exists monthly_one_on_ones_mentor_idx
  on public.monthly_one_on_ones (mentor_id);

-- keep updated_at fresh
drop trigger if exists set_updated_at on public.monthly_one_on_ones;
create trigger set_updated_at before update on public.monthly_one_on_ones
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.monthly_one_on_ones enable row level security;

drop policy if exists "ooo_admin_all"      on public.monthly_one_on_ones;
drop policy if exists "ooo_mentor_all"     on public.monthly_one_on_ones;
drop policy if exists "ooo_intern_select"  on public.monthly_one_on_ones;

-- Admins manage everything.
create policy "ooo_admin_all" on public.monthly_one_on_ones for all
  using (public.is_admin()) with check (public.is_admin());

-- The internship's assigned mentor can read + create + edit its 1-on-1s.
create policy "ooo_mentor_all" on public.monthly_one_on_ones for all
  using (exists (
    select 1 from public.internships i
    where i.id = monthly_one_on_ones.internship_id
      and i.mentor_id = public.current_app_user_id()
  ))
  with check (exists (
    select 1 from public.internships i
    where i.id = monthly_one_on_ones.internship_id
      and i.mentor_id = public.current_app_user_id()
  ));

-- Interns may read ONLY their own completed records.
create policy "ooo_intern_select" on public.monthly_one_on_ones for select
  using (
    status = 'completed'
    and exists (
      select 1 from public.internships i
      where i.id = monthly_one_on_ones.internship_id
        and i.user_id = public.current_app_user_id()
    )
  );
