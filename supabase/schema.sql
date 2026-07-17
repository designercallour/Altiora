-- ============================================================================
-- Altiora — Database Schema
-- Internship Intelligence Platform · Callour Studio
-- ----------------------------------------------------------------------------
-- Target: PostgreSQL 15+ (Supabase).
-- Run order: schema.sql  →  seed.sql
--
-- Conventions (see docs/DATABASE.md and docs/adr/ for the reasoning):
--   • UUID primary keys (gen_random_uuid()).
--   • All timestamps are timestamptz, stored in UTC.
--   • Every table has created_at + updated_at; mutable domain tables also
--     carry deleted_at for soft delete.
--   • Lookup/master tables for anything the org will manage over time.
--   • Enums ONLY for values that essentially never change:
--       user_role, internship_status, report_status.
--   • RLS enabled on every table. Admin = all, Mentor = assigned interns,
--     Intern = own data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists citext;         -- case-insensitive email

-- ----------------------------------------------------------------------------
-- Enums (stable value sets)
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'mentor', 'intern');
exception when duplicate_object then null; end $$;

do $$ begin
  create type internship_status as enum ('upcoming', 'active', 'paused', 'completed', 'terminated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('draft', 'submitted');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- LOOKUP / MASTER TABLES
-- Managed by the organization; referenced by analytics dimensions.
-- ============================================================================

-- Departments -----------------------------------------------------------------
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create unique index if not exists departments_slug_key
  on public.departments (slug) where deleted_at is null;

-- Teams (belong to a department) ----------------------------------------------
create table if not exists public.teams (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete restrict,
  name          text not null,
  slug          text not null,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists teams_department_id_idx on public.teams (department_id);
create unique index if not exists teams_dept_slug_key
  on public.teams (department_id, slug) where deleted_at is null;

-- Cohorts (internship batches) ------------------------------------------------
create table if not exists public.cohorts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  start_date  date not null,
  end_date    date not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create unique index if not exists cohorts_slug_key
  on public.cohorts (slug) where deleted_at is null;

-- Projects --------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null,
  department_id uuid references public.departments (id) on delete set null,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists projects_department_id_idx on public.projects (department_id);
create unique index if not exists projects_slug_key
  on public.projects (slug) where deleted_at is null;

-- Skill categories ------------------------------------------------------------
create table if not exists public.skill_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create unique index if not exists skill_categories_slug_key
  on public.skill_categories (slug) where deleted_at is null;

-- Skills ----------------------------------------------------------------------
create table if not exists public.skills (
  id                uuid primary key default gen_random_uuid(),
  skill_category_id uuid references public.skill_categories (id) on delete set null,
  name              text not null,
  slug              text not null,
  description       text,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index if not exists skills_category_id_idx on public.skills (skill_category_id);
create unique index if not exists skills_slug_key
  on public.skills (slug) where deleted_at is null;

-- Learning categories ---------------------------------------------------------
create table if not exists public.learning_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create unique index if not exists learning_categories_slug_key
  on public.learning_categories (slug) where deleted_at is null;

-- Learning sources ------------------------------------------------------------
create table if not exists public.learning_sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create unique index if not exists learning_sources_slug_key
  on public.learning_sources (slug) where deleted_at is null;

-- ============================================================================
-- IDENTITY
-- ============================================================================

-- Users — mirror of auth.users, enriched with app role + profile.
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid unique,                       -- FK to auth.users(id); nullable for seed rows
  email      citext not null,
  full_name  text not null,
  avatar_url text,
  role       user_role not null default 'intern',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists users_email_key
  on public.users (email) where deleted_at is null;
create index if not exists users_role_idx on public.users (role) where deleted_at is null;
create index if not exists users_auth_id_idx on public.users (auth_id);

-- ============================================================================
-- INTERNSHIP LIFECYCLE (the analytics hub)
-- ============================================================================

-- One row per intern-per-engagement. Everything reportable hangs off this:
-- mentor, cohort, department, team, project, position, duration, status.
create table if not exists public.internships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,       -- the intern
  mentor_id     uuid references public.users (id) on delete set null,               -- assigned mentor
  cohort_id     uuid references public.cohorts (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,
  team_id       uuid references public.teams (id) on delete set null,
  project_id    uuid references public.projects (id) on delete set null,            -- primary project
  position      text,
  start_date    date not null,
  end_date      date,
  status        internship_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists internships_user_id_idx      on public.internships (user_id)      where deleted_at is null;
create index if not exists internships_mentor_id_idx    on public.internships (mentor_id)    where deleted_at is null;
create index if not exists internships_cohort_id_idx    on public.internships (cohort_id);
create index if not exists internships_department_id_idx on public.internships (department_id);
create index if not exists internships_project_id_idx   on public.internships (project_id);
create index if not exists internships_status_idx       on public.internships (status);

-- ============================================================================
-- WEEKLY REPORTS + children
-- ============================================================================

-- One report per internship per ISO week.
-- Metric/qualitative fields are nullable so drafts can be partial;
-- completeness is enforced at submit time in the app (Zod).
create table if not exists public.weekly_reports (
  id            uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships (id) on delete cascade,
  year          int not null,
  week_number   int not null check (week_number between 1 and 53),
  start_date    date not null,
  end_date      date not null,
  mood          smallint check (mood between 1 and 6),
  satisfaction  smallint check (satisfaction between 1 and 10),
  achievement   text,
  challenge     text,
  solution      text,
  mentor_help   text,
  confidence    smallint check (confidence between 1 and 10),
  working_hours numeric(5, 1) check (working_hours >= 0),
  status        report_status not null default 'draft',
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create unique index if not exists weekly_reports_period_key
  on public.weekly_reports (internship_id, year, week_number)
  where deleted_at is null;
create index if not exists weekly_reports_internship_idx on public.weekly_reports (internship_id);
create index if not exists weekly_reports_status_idx     on public.weekly_reports (status) where deleted_at is null;
create index if not exists weekly_reports_period_idx     on public.weekly_reports (year, week_number);

-- Skill ratings for a report (1..5 per skill).
create table if not exists public.weekly_skill_scores (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.weekly_reports (id) on delete cascade,
  skill_id   uuid not null references public.skills (id) on delete restrict,
  score      smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists weekly_skill_scores_key
  on public.weekly_skill_scores (report_id, skill_id);
create index if not exists weekly_skill_scores_skill_idx on public.weekly_skill_scores (skill_id);

-- Learning logs — first-class entities. The heart of the intelligence layer.
create table if not exists public.learning_logs (
  id                   uuid primary key default gen_random_uuid(),
  report_id            uuid not null references public.weekly_reports (id) on delete cascade,
  learning_category_id uuid references public.learning_categories (id) on delete set null,
  learning_source_id   uuid references public.learning_sources (id) on delete set null,
  project_id           uuid references public.projects (id) on delete set null,   -- optional attribution
  title                text not null,
  difficulty           smallint check (difficulty between 1 and 5),
  confidence           smallint check (confidence between 1 and 5),
  impact               smallint check (impact between 1 and 5),
  applied              boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);
create index if not exists learning_logs_report_idx   on public.learning_logs (report_id);
create index if not exists learning_logs_category_idx on public.learning_logs (learning_category_id);
create index if not exists learning_logs_source_idx   on public.learning_logs (learning_source_id);
create index if not exists learning_logs_project_idx  on public.learning_logs (project_id);
create index if not exists learning_logs_applied_idx  on public.learning_logs (applied);

-- Mentor feedback — one per report.
create table if not exists public.mentor_feedback (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.weekly_reports (id) on delete cascade,
  mentor_id  uuid references public.users (id) on delete set null,
  feedback   text,
  next_goal  text,
  rating     smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists mentor_feedback_report_key
  on public.mentor_feedback (report_id) where deleted_at is null;
create index if not exists mentor_feedback_mentor_idx on public.mentor_feedback (mentor_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'departments','teams','cohorts','projects','skill_categories','skills',
    'learning_categories','learning_sources','users','internships',
    'weekly_reports','weekly_skill_scores','learning_logs','mentor_feedback'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Helper functions (SECURITY DEFINER so they can read public.users under RLS).
create or replace function public.current_app_user_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.users where auth_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.current_app_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.users where auth_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.current_app_role() = 'admin';
$$;

-- Enable RLS everywhere.
do $$
declare t text;
  tables text[] := array[
    'departments','teams','cohorts','projects','skill_categories','skills',
    'learning_categories','learning_sources','users','internships',
    'weekly_reports','weekly_skill_scores','learning_logs','mentor_feedback'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Lookup tables: any authenticated user may read; only admins may write. -------
do $$
declare t text;
  tables text[] := array[
    'departments','teams','cohorts','projects','skill_categories','skills',
    'learning_categories','learning_sources'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "%1$s_read" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_read" on public.%1$s for select
       to authenticated using (true);', t);
    execute format('drop policy if exists "%1$s_admin_write" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_admin_write" on public.%1$s for all
       to authenticated using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- users -----------------------------------------------------------------------
drop policy if exists "users_admin_all"   on public.users;
drop policy if exists "users_self_select" on public.users;
drop policy if exists "users_self_update" on public.users;
drop policy if exists "users_mentor_read" on public.users;

create policy "users_admin_all" on public.users for all
  using (public.is_admin()) with check (public.is_admin());

create policy "users_self_select" on public.users for select
  using (auth_id = auth.uid());

create policy "users_self_update" on public.users for update
  using (auth_id = auth.uid()) with check (auth_id = auth.uid());

-- Mentors can read the profiles of interns assigned to them.
create policy "users_mentor_read" on public.users for select
  using (exists (
    select 1 from public.internships i
    where i.user_id = public.users.id
      and i.mentor_id = public.current_app_user_id()
      and i.deleted_at is null
  ));

-- internships -----------------------------------------------------------------
drop policy if exists "internships_admin_all"     on public.internships;
drop policy if exists "internships_intern_select" on public.internships;
drop policy if exists "internships_mentor_select" on public.internships;

create policy "internships_admin_all" on public.internships for all
  using (public.is_admin()) with check (public.is_admin());

create policy "internships_intern_select" on public.internships for select
  using (user_id = public.current_app_user_id());

create policy "internships_mentor_select" on public.internships for select
  using (mentor_id = public.current_app_user_id());

-- weekly_reports --------------------------------------------------------------
drop policy if exists "wr_admin_all"     on public.weekly_reports;
drop policy if exists "wr_intern_select" on public.weekly_reports;
drop policy if exists "wr_intern_write"  on public.weekly_reports;
drop policy if exists "wr_mentor_select" on public.weekly_reports;

create policy "wr_admin_all" on public.weekly_reports for all
  using (public.is_admin()) with check (public.is_admin());

create policy "wr_intern_select" on public.weekly_reports for select
  using (exists (
    select 1 from public.internships i
    where i.id = weekly_reports.internship_id
      and i.user_id = public.current_app_user_id()
  ));

-- Interns create/update/delete their own reports.
create policy "wr_intern_write" on public.weekly_reports for all
  using (exists (
    select 1 from public.internships i
    where i.id = weekly_reports.internship_id
      and i.user_id = public.current_app_user_id()
  ))
  with check (exists (
    select 1 from public.internships i
    where i.id = weekly_reports.internship_id
      and i.user_id = public.current_app_user_id()
  ));

create policy "wr_mentor_select" on public.weekly_reports for select
  using (exists (
    select 1 from public.internships i
    where i.id = weekly_reports.internship_id
      and i.mentor_id = public.current_app_user_id()
  ));

-- Reusable predicate: does the current user own the report (as intern)?
create or replace function public.owns_report(p_report_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.weekly_reports r
    join public.internships i on i.id = r.internship_id
    where r.id = p_report_id and i.user_id = public.current_app_user_id()
  );
$$;

create or replace function public.mentors_report(p_report_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.weekly_reports r
    join public.internships i on i.id = r.internship_id
    where r.id = p_report_id and i.mentor_id = public.current_app_user_id()
  );
$$;

-- weekly_skill_scores ---------------------------------------------------------
drop policy if exists "wss_admin_all"     on public.weekly_skill_scores;
drop policy if exists "wss_intern_write"  on public.weekly_skill_scores;
drop policy if exists "wss_mentor_select" on public.weekly_skill_scores;

create policy "wss_admin_all" on public.weekly_skill_scores for all
  using (public.is_admin()) with check (public.is_admin());

create policy "wss_intern_write" on public.weekly_skill_scores for all
  using (public.owns_report(report_id)) with check (public.owns_report(report_id));

create policy "wss_mentor_select" on public.weekly_skill_scores for select
  using (public.mentors_report(report_id));

-- learning_logs ---------------------------------------------------------------
drop policy if exists "ll_admin_all"     on public.learning_logs;
drop policy if exists "ll_intern_write"  on public.learning_logs;
drop policy if exists "ll_mentor_select" on public.learning_logs;

create policy "ll_admin_all" on public.learning_logs for all
  using (public.is_admin()) with check (public.is_admin());

create policy "ll_intern_write" on public.learning_logs for all
  using (public.owns_report(report_id)) with check (public.owns_report(report_id));

create policy "ll_mentor_select" on public.learning_logs for select
  using (public.mentors_report(report_id));

-- mentor_feedback -------------------------------------------------------------
drop policy if exists "mf_admin_all"      on public.mentor_feedback;
drop policy if exists "mf_intern_select"  on public.mentor_feedback;
drop policy if exists "mf_mentor_write"   on public.mentor_feedback;

create policy "mf_admin_all" on public.mentor_feedback for all
  using (public.is_admin()) with check (public.is_admin());

-- Interns can read feedback on their own reports.
create policy "mf_intern_select" on public.mentor_feedback for select
  using (public.owns_report(report_id));

-- Mentors manage feedback on reports of their assigned interns.
create policy "mf_mentor_write" on public.mentor_feedback for all
  using (public.mentors_report(report_id))
  with check (public.mentors_report(report_id));

-- ============================================================================
-- AUTH INTEGRATION
-- On new auth.users signup, create a matching public.users row.
-- Role defaults to 'intern'; admins promote users afterward.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (auth_id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    'intern'
  )
  on conflict (auth_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- End of schema.
-- ============================================================================
