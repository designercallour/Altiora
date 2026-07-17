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
