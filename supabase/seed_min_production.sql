-- ============================================================================
-- Altiora — minimum production seed (idempotent, safe to re-run)
-- ============================================================================
-- Run in the Supabase SQL editor (as the postgres role, which bypasses RLS).
--
-- Seeds the minimum data to exercise every management feature:
--   • 1 admin    — designer@callourstudio.com (already exists via login; we just
--                  ensure the allowlist + role)
--   • 1 mentor   — mentor.demo@callourstudio.com
--   • 1 cohort   — Summer 2026
--   • 1 ACTIVE   intern — period spans today (Active)
--   • 1 INACTIVE intern — period already ended (Inactive/Completed)
--
-- Intern/mentor rows are created WITHOUT auth_id. They become real logins the
-- moment that person signs in with Google using the whitelisted email — the
-- handle_new_user trigger links the auth account to the existing row by email.
--
-- Dates are anchored so status is correct as of mid-2026 (today ≈ 2026-07-20):
--   active   : 2026-06-01 → 2026-09-01  (today is inside → Active)
--   inactive : 2026-02-02 → 2026-05-01  (ended in the past → Inactive)
-- ============================================================================

do $$
declare
  v_mentor_id   uuid;
  v_cohort_id   uuid;
  v_user_active uuid;
  v_user_past   uuid;
  v_active_ins  uuid;
  v_past_ins    uuid;
begin
  -- 0. Admin -----------------------------------------------------------------
  insert into public.allowed_emails (email, role)
  values ('designer@callourstudio.com', 'admin')
  on conflict (email) do update set role = 'admin';

  update public.users set role = 'admin'
   where email = 'designer@callourstudio.com'
     and deleted_at is null and role <> 'admin';

  -- 1. Mentor ----------------------------------------------------------------
  insert into public.allowed_emails (email, role)
  values ('mentor.demo@callourstudio.com', 'mentor')
  on conflict (email) do update set role = 'mentor';

  select id into v_mentor_id from public.users
   where email = 'mentor.demo@callourstudio.com' and deleted_at is null;
  if v_mentor_id is null then
    insert into public.users (email, full_name, role)
    values ('mentor.demo@callourstudio.com', 'Demo Mentor', 'mentor')
    returning id into v_mentor_id;
  end if;

  -- 2. Cohort ----------------------------------------------------------------
  select id into v_cohort_id from public.cohorts
   where slug = 'summer-2026' and deleted_at is null;
  if v_cohort_id is null then
    insert into public.cohorts (name, slug, description, start_date, end_date)
    values ('Summer 2026', 'summer-2026', 'Seed cohort', '2026-05-11', '2026-08-07')
    returning id into v_cohort_id;
  end if;

  -- 3. ACTIVE intern ---------------------------------------------------------
  insert into public.allowed_emails (email, role)
  values ('intern.active@callourstudio.com', 'intern')
  on conflict (email) do update set role = 'intern';

  select id into v_user_active from public.users
   where email = 'intern.active@callourstudio.com' and deleted_at is null;
  if v_user_active is null then
    insert into public.users (email, full_name, role)
    values ('intern.active@callourstudio.com', 'Active Intern', 'intern')
    returning id into v_user_active;
  end if;

  select id into v_active_ins from public.internships
   where user_id = v_user_active and deleted_at is null;
  if v_active_ins is null then
    insert into public.internships
      (user_id, mentor_id, cohort_id, position, start_date, end_date, status, notes)
    values
      (v_user_active, v_mentor_id, v_cohort_id, 'Product Design Intern',
       '2026-06-01', '2026-09-01', 'active', 'Seed active intern')
    returning id into v_active_ins;

    insert into public.mentor_assignments (internship_id, mentor_id, started_at)
    values (v_active_ins, v_mentor_id, timestamptz '2026-06-01 00:00:00+00');
  end if;

  -- 4. INACTIVE intern -------------------------------------------------------
  insert into public.allowed_emails (email, role)
  values ('intern.past@callourstudio.com', 'intern')
  on conflict (email) do update set role = 'intern';

  select id into v_user_past from public.users
   where email = 'intern.past@callourstudio.com' and deleted_at is null;
  if v_user_past is null then
    insert into public.users (email, full_name, role)
    values ('intern.past@callourstudio.com', 'Past Intern', 'intern')
    returning id into v_user_past;
  end if;

  select id into v_past_ins from public.internships
   where user_id = v_user_past and deleted_at is null;
  if v_past_ins is null then
    insert into public.internships
      (user_id, mentor_id, cohort_id, position, start_date, end_date, status, notes)
    values
      (v_user_past, v_mentor_id, v_cohort_id, 'Engineering Intern',
       '2026-02-02', '2026-05-01', 'completed', 'Seed inactive intern')
    returning id into v_past_ins;

    insert into public.mentor_assignments (internship_id, mentor_id, started_at)
    values (v_past_ins, v_mentor_id, timestamptz '2026-02-02 00:00:00+00');
  end if;
end $$;

-- Verify -----------------------------------------------------------------------
select
  (select count(*) from public.allowed_emails
     where email in ('designer@callourstudio.com','mentor.demo@callourstudio.com',
                     'intern.active@callourstudio.com','intern.past@callourstudio.com'))
     as allowlist_rows,
  (select count(*) from public.users where role = 'mentor' and deleted_at is null) as mentors,
  (select count(*) from public.cohorts where deleted_at is null) as cohorts,
  (select count(*) from public.internships where deleted_at is null) as internships,
  (select count(*) from public.mentor_assignments where ended_at is null) as open_assignments;
