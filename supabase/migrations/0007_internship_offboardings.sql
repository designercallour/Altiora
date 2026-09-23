-- ============================================================================
-- Migration 0007 — Internship Offboarding (exit 1-on-1 + handover)
--
-- One record per internship: the terminal 60-minute exit 1-on-1 (reflection,
-- two-way feedback incl. per-founder + team + studio) plus the handover /
-- access / LinkedIn checklist. Authored by the supervisor; the intern reads it
-- once completed. Safe + idempotent; run in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.internship_offboardings (
  id                      uuid primary key default gen_random_uuid(),
  internship_id           uuid not null references public.internships (id) on delete cascade,
  supervisor_id           uuid references public.users (id) on delete set null, -- authoring supervisor (snapshot)
  session_date            date,
  last_day                date,
  -- 2.2 intern reflection
  reflection_achievement  text,
  reflection_challenge    text,
  reflection_skill        text,
  -- 2.3 supervisor -> intern
  supervisor_feedback     text,
  -- 2.4 intern -> ...
  feedback_for_supervisor text,
  founder_feedback        jsonb not null default '[]'::jsonb, -- [{founder, good, improve}]
  feedback_for_team       text,
  feedback_for_studio     text,
  would_recommend         boolean,
  -- 2.5 career
  career_plan             text,
  -- 1 / 3 / 4 checklist
  checklist               jsonb not null default '{}'::jsonb,  -- { key: boolean }
  -- 5 notes
  notes_key_points        text,
  notes_follow_up         text,
  status                  text not null default 'not_started'
                            check (status in ('not_started', 'completed')),
  completed_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- One offboarding record per internship.
create unique index if not exists internship_offboardings_internship_key
  on public.internship_offboardings (internship_id);

create index if not exists internship_offboardings_supervisor_idx
  on public.internship_offboardings (supervisor_id);

-- keep updated_at fresh
drop trigger if exists set_updated_at on public.internship_offboardings;
create trigger set_updated_at before update on public.internship_offboardings
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.internship_offboardings enable row level security;

drop policy if exists "off_admin_all"     on public.internship_offboardings;
drop policy if exists "off_mentor_all"    on public.internship_offboardings;
drop policy if exists "off_intern_select" on public.internship_offboardings;

-- Admins manage everything.
create policy "off_admin_all" on public.internship_offboardings for all
  using (public.is_admin()) with check (public.is_admin());

-- The internship's assigned mentor can read + create + edit its offboarding.
create policy "off_mentor_all" on public.internship_offboardings for all
  using (exists (
    select 1 from public.internships i
    where i.id = internship_offboardings.internship_id
      and i.mentor_id = public.current_app_user_id()
  ))
  with check (exists (
    select 1 from public.internships i
    where i.id = internship_offboardings.internship_id
      and i.mentor_id = public.current_app_user_id()
  ));

-- Interns may read ONLY their own completed record.
create policy "off_intern_select" on public.internship_offboardings for select
  using (
    status = 'completed'
    and exists (
      select 1 from public.internships i
      where i.id = internship_offboardings.internship_id
        and i.user_id = public.current_app_user_id()
    )
  );
