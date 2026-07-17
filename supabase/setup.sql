-- ============================================================================
-- Altiora — Combined setup (schema + seed). Run once in the Supabase SQL Editor.
-- Generated from supabase/schema.sql + supabase/seed.sql.
-- ============================================================================

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
  reviewed_at   timestamptz,                                                     -- set when the mentor marks it reviewed
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

-- AI-extracted learning intelligence — one per report.
create table if not exists public.report_intelligence (
  report_id          uuid primary key references public.weekly_reports (id) on delete cascade,
  summary            text,
  learning_direction text[]  not null default '{}',
  recommended_topics text[]  not null default '{}',
  skills             jsonb   not null default '[]',
  concepts           jsonb   not null default '[]',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'departments','teams','cohorts','projects','skill_categories','skills',
    'learning_categories','learning_sources','users','internships',
    'weekly_reports','weekly_skill_scores','learning_logs','mentor_feedback',
    'report_intelligence'
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
    'weekly_reports','weekly_skill_scores','learning_logs','mentor_feedback',
    'report_intelligence'
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
drop policy if exists "wr_admin_all"      on public.weekly_reports;
drop policy if exists "wr_intern_select"  on public.weekly_reports;
drop policy if exists "wr_intern_write"   on public.weekly_reports;
drop policy if exists "wr_mentor_select"  on public.weekly_reports;
drop policy if exists "wr_mentor_review"  on public.weekly_reports;

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

-- Mentors may mark their interns' submitted reports as reviewed (reviewed_at).
create policy "wr_mentor_review" on public.weekly_reports for update
  using (exists (
    select 1 from public.internships i
    where i.id = weekly_reports.internship_id
      and i.mentor_id = public.current_app_user_id()
  ))
  with check (exists (
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

-- report_intelligence -----------------------------------------------------------
drop policy if exists "ri_admin_all"     on public.report_intelligence;
drop policy if exists "ri_intern_write"  on public.report_intelligence;
drop policy if exists "ri_mentor_select" on public.report_intelligence;

create policy "ri_admin_all" on public.report_intelligence for all
  using (public.is_admin()) with check (public.is_admin());

create policy "ri_intern_write" on public.report_intelligence for all
  using (public.owns_report(report_id))
  with check (public.owns_report(report_id));

create policy "ri_mentor_select" on public.report_intelligence for select
  using (public.mentors_report(report_id));

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


-- ============================================================================
-- Altiora — Seed Data
-- Run AFTER schema.sql. Idempotent: truncates then re-seeds.
--
-- Produces:
--   1 admin · 2 mentors · 10 interns · 2 cohorts · 4 departments · 6 teams
--   · 6 projects · 4 skill categories · 8 skills · 10 learning categories
--   · 8 learning sources · 10 internships · 100 weekly reports
--   · 800 skill scores · 500 learning logs · 90 mentor feedback entries
--
-- NOTE ON AUTH: seeded users get a random placeholder auth_id (they have no
-- Supabase Auth login). To sign in AS a seeded user, sign in with Google, then
-- point that seeded row at your auth id:
--   update public.users set auth_id = '<auth.uid()>' where email = 'maya@callourstudio.com';
-- ============================================================================

begin;

truncate
  public.mentor_feedback,
  public.weekly_skill_scores,
  public.learning_logs,
  public.weekly_reports,
  public.internships,
  public.users,
  public.projects,
  public.teams,
  public.cohorts,
  public.departments,
  public.skills,
  public.skill_categories,
  public.learning_categories,
  public.learning_sources
restart identity cascade;

-- ── Lookups ──────────────────────────────────────────────────────────────────
insert into public.departments (name, slug) values
  ('Design', 'design'),
  ('Engineering', 'engineering'),
  ('Product', 'product'),
  ('Marketing', 'marketing');

insert into public.teams (department_id, name, slug) values
  ((select id from public.departments where slug = 'design'),      'Brand', 'brand'),
  ((select id from public.departments where slug = 'design'),      'Product Design', 'product-design'),
  ((select id from public.departments where slug = 'engineering'), 'Web', 'web'),
  ((select id from public.departments where slug = 'engineering'), 'Platform', 'platform'),
  ((select id from public.departments where slug = 'product'),     'Growth', 'growth'),
  ((select id from public.departments where slug = 'marketing'),   'Content', 'content');

insert into public.cohorts (name, slug, start_date, end_date) values
  ('Spring 2026', 'spring-2026', date '2026-02-02', date '2026-05-01'),
  ('Summer 2026', 'summer-2026', date '2026-05-11', date '2026-08-07');

insert into public.projects (name, slug, department_id) values
  ('Altiora Platform',    'altiora-platform', (select id from public.departments where slug = 'product')),
  ('Client Portal Revamp','client-portal',    (select id from public.departments where slug = 'engineering')),
  ('Brand System 2.0',    'brand-system',      (select id from public.departments where slug = 'design')),
  ('Mobile App',          'mobile-app',        (select id from public.departments where slug = 'engineering')),
  ('Marketing Site',      'marketing-site',    (select id from public.departments where slug = 'marketing')),
  ('Design Ops',          'design-ops',        (select id from public.departments where slug = 'design'));

insert into public.skill_categories (name, slug, sort_order) values
  ('Craft', 'craft', 1),
  ('Thinking', 'thinking', 2),
  ('Communication', 'communication', 3),
  ('Delivery', 'delivery', 4);

insert into public.skills (skill_category_id, name, slug, sort_order) values
  ((select id from public.skill_categories where slug = 'craft'),         'UI Design', 'ui-design', 1),
  ((select id from public.skill_categories where slug = 'craft'),         'UX Thinking', 'ux-thinking', 2),
  ((select id from public.skill_categories where slug = 'communication'), 'Communication', 'communication', 3),
  ((select id from public.skill_categories where slug = 'thinking'),      'Problem Solving', 'problem-solving', 4),
  ((select id from public.skill_categories where slug = 'thinking'),      'Critical Thinking', 'critical-thinking', 5),
  ((select id from public.skill_categories where slug = 'communication'), 'Presentation', 'presentation', 6),
  ((select id from public.skill_categories where slug = 'delivery'),      'Time Management', 'time-management', 7),
  ((select id from public.skill_categories where slug = 'thinking'),      'Research', 'research', 8);

insert into public.learning_categories (name, slug, sort_order) values
  ('UI Design', 'ui-design', 1),
  ('UX', 'ux', 2),
  ('Research', 'research', 3),
  ('Communication', 'communication', 4),
  ('Presentation', 'presentation', 5),
  ('Business', 'business', 6),
  ('AI', 'ai', 7),
  ('Coding', 'coding', 8),
  ('Soft Skill', 'soft-skill', 9),
  ('Other', 'other', 10);

insert into public.learning_sources (name, slug, sort_order) values
  ('Mentor', 'mentor', 1),
  ('Project', 'project', 2),
  ('Client', 'client', 3),
  ('Self Learning', 'self-learning', 4),
  ('Youtube', 'youtube', 5),
  ('Course', 'course', 6),
  ('Article', 'article', 7),
  ('Book', 'book', 8);

-- ── Users ────────────────────────────────────────────────────────────────────
insert into public.users (auth_id, email, full_name, role) values
  (gen_random_uuid(), 'admin@callourstudio.com', 'Callour Admin', 'admin'),
  (gen_random_uuid(), 'aria@callourstudio.com',  'Aria Nakamura', 'mentor'),
  (gen_random_uuid(), 'devon@callourstudio.com', 'Devon Reyes',   'mentor'),
  (gen_random_uuid(), 'maya@callourstudio.com',  'Maya Putri',    'intern'),
  (gen_random_uuid(), 'leo@callourstudio.com',   'Leo Hartono',   'intern'),
  (gen_random_uuid(), 'sofia@callourstudio.com', 'Sofia Alvarez', 'intern'),
  (gen_random_uuid(), 'nadia@callourstudio.com', 'Nadia Rahman',  'intern'),
  (gen_random_uuid(), 'kai@callourstudio.com',   'Kai Winarno',   'intern'),
  (gen_random_uuid(), 'priya@callourstudio.com', 'Priya Sharma',  'intern'),
  (gen_random_uuid(), 'ethan@callourstudio.com', 'Ethan Cole',    'intern'),
  (gen_random_uuid(), 'tara@callourstudio.com',  'Tara Sinaga',   'intern'),
  (gen_random_uuid(), 'marco@callourstudio.com', 'Marco Bianchi', 'intern'),
  (gen_random_uuid(), 'yuki@callourstudio.com',  'Yuki Tanaka',   'intern');

-- ── Internships ────────────────────────────────────────────────────────────
do $$
declare
  r record;
  idx int := 0;
  mentor_ids uuid[];
  cohort_ids uuid[];
  dept_ids uuid[];
  proj_ids uuid[];
  positions text[] := array[
    'UI Design Intern','UX Design Intern','Product Design Intern',
    'Design Research Intern','Brand Design Intern'
  ];
  v_cohort uuid; v_mentor uuid; v_dept uuid; v_proj uuid; v_team uuid;
  v_start date; v_end date; v_status internship_status;
begin
  select array_agg(id order by email) into mentor_ids from public.users where role = 'mentor';
  select array_agg(id order by slug)  into cohort_ids from public.cohorts;
  select array_agg(id order by slug)  into dept_ids   from public.departments;
  select array_agg(id order by slug)  into proj_ids   from public.projects;

  for r in select id from public.users where role = 'intern' order by email loop
    v_cohort := case when idx < 5 then cohort_ids[1] else cohort_ids[2] end;  -- spring / summer
    v_mentor := mentor_ids[1 + (idx % array_length(mentor_ids, 1))];
    v_dept   := dept_ids[1 + (idx % array_length(dept_ids, 1))];
    v_proj   := proj_ids[1 + (idx % array_length(proj_ids, 1))];
    select id into v_team from public.teams where department_id = v_dept order by slug limit 1;
    select start_date, end_date into v_start, v_end from public.cohorts where id = v_cohort;
    v_status := case when v_cohort = cohort_ids[1] then 'completed' else 'active' end;

    insert into public.internships (
      user_id, mentor_id, cohort_id, department_id, team_id, project_id,
      position, start_date, end_date, status
    ) values (
      r.id, v_mentor, v_cohort, v_dept, v_team, v_proj,
      positions[1 + (idx % array_length(positions, 1))], v_start, v_end, v_status
    );

    idx := idx + 1;
  end loop;
end $$;

-- ── Weekly reports + skill scores + learning logs + feedback ─────────────────
do $$
declare
  v_intern record;
  v_skill record;
  v_report_id uuid;
  v_week_index int;
  v_offset int;
  n_weeks int := 10;
  v_anchor date;
  v_is_completed boolean;
  v_monday date; v_start date; v_end date;
  v_year int; v_week int;
  g float;
  v_mood int; v_sat int; v_conf int;
  v_hours numeric;
  cat_ids uuid[]; src_ids uuid[]; v_proj uuid;
  li int;
  titles text[] := array[
    'Auto-layout patterns','Clearer microcopy','Lightweight usability testing',
    'Design tokens & theming','Structuring a critique','Accessibility (WCAG AA)',
    'Prototyping interactions','IA card sorting','AI-assisted research','Handoff specs'
  ];
  goals text[] := array[
    'Lead a section of the next design review.',
    'Ship one improvement end-to-end.',
    'Run a short usability test and share findings.',
    'Tighten your handoff specs.'
  ];
begin
  perform setseed(0.4242);
  select array_agg(id order by sort_order) into cat_ids from public.learning_categories;
  select array_agg(id order by sort_order) into src_ids from public.learning_sources;

  for v_intern in
    select i.id as internship_id, i.project_id, i.mentor_id,
           c.slug as cohort_slug, c.end_date as cohort_end
    from public.internships i
    join public.cohorts c on c.id = i.cohort_id
  loop
    v_is_completed := (v_intern.cohort_slug = 'spring-2026');
    v_anchor := case when v_is_completed then v_intern.cohort_end else current_date end;

    for v_week_index in 0 .. (n_weeks - 1) loop
      v_offset := case when v_is_completed
                       then v_week_index - (n_weeks - 1)  -- last 10 weeks of cohort
                       else v_week_index - n_weeks end;   -- previous 10 weeks (leave current open)
      v_monday := date_trunc('week', v_anchor::timestamp)::date + (v_offset * 7);
      v_start := v_monday;
      v_end := v_monday + 6;
      v_year := extract(isoyear from v_monday)::int;
      v_week := extract(week from v_monday)::int;
      g := v_week_index::float / (n_weeks - 1);

      v_mood := least(6, greatest(1, round(3 + g * 2 + (random() * 2 - 1))::int));
      v_sat  := least(10, greatest(1, round(5 + g * 3 + (random() * 2 - 1))::int));
      v_conf := least(10, greatest(1, round(4 + g * 4 + (random() * 2 - 1))::int));
      v_hours := case when random() < 0.85 then round((34 + random() * 12)::numeric, 1) else null end;

      insert into public.weekly_reports (
        internship_id, year, week_number, start_date, end_date,
        mood, satisfaction, achievement, challenge, solution, mentor_help,
        confidence, working_hours, status, submitted_at
      ) values (
        v_intern.internship_id, v_year, v_week, v_start, v_end,
        v_mood, v_sat,
        'Shipped meaningful work this week and reflected on the process.',
        'Balancing polish with speed under a tight timeline.',
        'Time-boxed exploration, then paired with my mentor to unblock.',
        case when random() < 0.55 then 'Would appreciate a review before I go further.' else null end,
        v_conf, v_hours, 'submitted', (v_end + 1)::timestamptz
      )
      returning id into v_report_id;

      -- 8 skill scores
      for v_skill in select id from public.skills loop
        insert into public.weekly_skill_scores (report_id, skill_id, score)
        values (v_report_id, v_skill.id,
                least(5, greatest(1, round(2.4 + g * 2 + (random() * 0.8 - 0.4))::int)));
      end loop;

      -- 5 learning logs
      for li in 1 .. 5 loop
        v_proj := case when random() < 0.5 then v_intern.project_id else null end;
        insert into public.learning_logs (
          report_id, learning_category_id, learning_source_id, project_id,
          title, difficulty, confidence, impact, applied
        ) values (
          v_report_id,
          cat_ids[1 + floor(random() * array_length(cat_ids, 1))::int],
          src_ids[1 + floor(random() * array_length(src_ids, 1))::int],
          v_proj,
          titles[1 + floor(random() * array_length(titles, 1))::int],
          1 + floor(random() * 5)::int,
          least(5, greatest(1, round(2.5 + g * 2 + (random() * 2 - 1))::int)),
          least(5, greatest(1, round(3 + g + (random() * 2 - 1))::int)),
          random() < (0.45 + g * 0.3)
        );
      end loop;

      -- feedback on every week except the most recent (leaves it "needs review")
      if v_week_index < n_weeks - 1 then
        insert into public.mentor_feedback (report_id, mentor_id, feedback, next_goal, rating)
        values (
          v_report_id, v_intern.mentor_id,
          'Strong progress — your reflections are getting sharper. Keep documenting the why behind your decisions.',
          goals[1 + floor(random() * array_length(goals, 1))::int],
          least(5, greatest(1, round(3 + g * 2 + (random() - 0.5))::int))
        );
      end if;
    end loop;
  end loop;
end $$;

commit;

-- Sanity checks (uncomment to verify):
-- select count(*) from public.weekly_reports;      -- 100
-- select count(*) from public.weekly_skill_scores; -- 800
-- select count(*) from public.learning_logs;       -- 500
-- select count(*) from public.mentor_feedback;     -- 90
