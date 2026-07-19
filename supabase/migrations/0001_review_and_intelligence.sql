-- ============================================================================
-- Migration 0001 — mentor review tracking + AI learning intelligence
--
-- Safe to run against an existing Altiora database that was created from
-- supabase/setup.sql. Every statement is idempotent (IF NOT EXISTS / drop-then-
-- create), so re-running does no harm.
--
-- Run this in the Supabase SQL editor BEFORE switching the app to
-- NEXT_PUBLIC_DATA_SOURCE=supabase.
-- ============================================================================

-- 1. weekly_reports.reviewed_at -------------------------------------------------
-- Set when a mentor marks a submitted report reviewed. `needsReview` keys off it.
alter table public.weekly_reports
  add column if not exists reviewed_at timestamptz;

-- Mentors may update their own interns' reports (to set reviewed_at).
drop policy if exists "wr_mentor_review" on public.weekly_reports;
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

-- 2. report_intelligence --------------------------------------------------------
-- AI-extracted learning signal, one row per report.
create table if not exists public.report_intelligence (
  report_id          uuid primary key references public.weekly_reports (id) on delete cascade,
  summary            text,
  learning_direction text[]  not null default '{}',
  recommended_topics text[]  not null default '{}',
  skills             jsonb   not null default '[]',   -- [{name,confidence,learningStatus,importance,evidence}]
  concepts           jsonb   not null default '[]',   -- [{name,relatedSkill}]
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.report_intelligence enable row level security;

drop policy if exists "ri_admin_all"     on public.report_intelligence;
drop policy if exists "ri_intern_write"  on public.report_intelligence;
drop policy if exists "ri_mentor_select" on public.report_intelligence;

create policy "ri_admin_all" on public.report_intelligence for all
  using (public.is_admin()) with check (public.is_admin());

-- Interns own the extraction for their own reports (written at submit time).
create policy "ri_intern_write" on public.report_intelligence for all
  using (public.owns_report(report_id))
  with check (public.owns_report(report_id));

create policy "ri_mentor_select" on public.report_intelligence for select
  using (public.mentors_report(report_id));

-- keep updated_at fresh
drop trigger if exists set_updated_at on public.report_intelligence;
create trigger set_updated_at before update on public.report_intelligence
  for each row execute function public.set_updated_at();
