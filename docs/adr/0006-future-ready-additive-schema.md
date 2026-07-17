# ADR-0006 — Future-ready, additive schema evolution

**Status:** Accepted

## Context

Altiora will grow far past the MVP: goals, AI summaries, burnout detection, a
competency matrix, a knowledge base, notifications, certificates, and more. A
schema that has to be restructured for each of these is a liability. The MVP tables
in `supabase/schema.sql` were designed so future features **attach additively** —
new tables, or nullable columns, that reference the _existing_ keys — rather than
reshaping what already exists.

## Decision

Future capabilities are added by:

1. Creating **new tables** whose FKs point at existing tables
   (`internships`, `weekly_reports`, `users`, `learning_logs`, `skills`, …), or
2. Adding **nullable columns** to existing tables.

We never rename or restructure MVP tables to accommodate a new feature. The hub
(`internships`) and the report tree (`weekly_reports` → children) are the stable
anchors everything hangs off.

The sketches below reference real MVP columns to demonstrate non-restructuring
attachment.

> All SQL below is a **future sketch — not in the MVP schema.** Types and
> constraints are indicative.

### `goals` — objectives tied to an engagement / person

```sql
-- FUTURE, not in MVP
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships (id) on delete cascade,
  created_by    uuid references public.users (id) on delete set null,   -- mentor or intern
  title         text not null,
  description   text,
  target_date   date,
  status        text not null default 'open',   -- open | met | dropped
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
```

### `weekly_report_ai_summaries` — generated summary per report

```sql
-- FUTURE, not in MVP
create table if not exists public.weekly_report_ai_summaries (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid not null references public.weekly_reports (id) on delete cascade,
  summary      text not null,
  model        text not null,          -- e.g. provider/model id
  prompt_tokens  int,
  output_tokens  int,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists wr_ai_summary_report_key
  on public.weekly_report_ai_summaries (report_id);
```

### `burnout_signals` — computed risk per engagement

```sql
-- FUTURE, not in MVP
create table if not exists public.burnout_signals (
  id            uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships (id) on delete cascade,
  computed_for  date not null,          -- window end (e.g. ISO week end)
  risk_score    numeric(4,3) not null,  -- 0..1
  factors       jsonb,                  -- e.g. declining mood, rising hours
  created_at    timestamptz not null default now()
);
create index if not exists burnout_signals_internship_idx
  on public.burnout_signals (internship_id, computed_for);
```

Derived from existing `weekly_reports.mood`, `satisfaction`, `confidence`,
`working_hours` over the internship's report stream.

### Competency matrix — `competencies`, `competency_levels`, `intern_competencies`

```sql
-- FUTURE, not in MVP
create table if not exists public.competencies (
  id                uuid primary key default gen_random_uuid(),
  skill_category_id uuid references public.skill_categories (id) on delete set null,
  name              text not null,
  slug              text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table if not exists public.competency_levels (
  id            uuid primary key default gen_random_uuid(),
  competency_id uuid not null references public.competencies (id) on delete cascade,
  level         smallint not null,      -- 1..N
  label         text not null,          -- e.g. 'novice', 'proficient'
  descriptor    text,
  created_at    timestamptz not null default now(),
  unique (competency_id, level)
);

create table if not exists public.intern_competencies (
  id             uuid primary key default gen_random_uuid(),
  internship_id  uuid not null references public.internships (id) on delete cascade,
  competency_id  uuid not null references public.competencies (id) on delete cascade,
  level_id       uuid references public.competency_levels (id) on delete set null,
  assessed_by    uuid references public.users (id) on delete set null,
  assessed_at    timestamptz not null default now(),
  unique (internship_id, competency_id)
);
```

Complements — does not replace — the MVP `skills` / `weekly_skill_scores`
weekly scoring.

### `knowledge_base_articles` — learning promoted into shared knowledge

```sql
-- FUTURE, not in MVP
create table if not exists public.knowledge_base_articles (
  id                 uuid primary key default gen_random_uuid(),
  source_learning_log_id uuid references public.learning_logs (id) on delete set null,
  author_id          uuid references public.users (id) on delete set null,
  title              text not null,
  body               text not null,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
```

A high-`impact` `learning_logs` entry becomes the seed of a shared article.

### `notifications` — per-user delivery queue

```sql
-- FUTURE, not in MVP
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  kind       text not null,          -- e.g. 'feedback_received', 'report_due'
  payload    jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;
```

### `announcements` — org-wide / scoped broadcasts

```sql
-- FUTURE, not in MVP
create table if not exists public.announcements (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid references public.users (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,  -- null = org-wide
  cohort_id     uuid references public.cohorts (id) on delete set null,
  title         text not null,
  body          text not null,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
```

### `attachments` — files against an entity

Two viable shapes; both are additive.

```sql
-- FUTURE, not in MVP — Option A: polymorphic
create table if not exists public.attachments (
  id              uuid primary key default gen_random_uuid(),
  attachable_type text not null,   -- 'weekly_report' | 'learning_log' | 'internship' | ...
  attachable_id   uuid not null,
  uploaded_by     uuid references public.users (id) on delete set null,
  file_url        text not null,
  mime_type       text,
  byte_size       bigint,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists attachments_owner_idx
  on public.attachments (attachable_type, attachable_id);

-- FUTURE, not in MVP — Option B: typed FK (preferred if attachments are report-only)
create table if not exists public.report_attachments (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.weekly_reports (id) on delete cascade,
  uploaded_by uuid references public.users (id) on delete set null,
  file_url    text not null,
  mime_type   text,
  byte_size   bigint,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
```

Option B keeps referential integrity and cascade behavior; Option A trades that
for flexibility across many entity types.

### `internship_certificates` — completion artifact

```sql
-- FUTURE, not in MVP
create table if not exists public.internship_certificates (
  id            uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships (id) on delete cascade,
  issued_by     uuid references public.users (id) on delete set null,
  serial        text not null,
  file_url      text,
  issued_at     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create unique index if not exists internship_certificates_serial_key
  on public.internship_certificates (serial);
```

Naturally gated on `internships.status = 'completed'`.

### `performance_reviews` — formal review of an engagement

```sql
-- FUTURE, not in MVP
create table if not exists public.performance_reviews (
  id            uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships (id) on delete cascade,
  reviewer_id   uuid references public.users (id) on delete set null,
  period_start  date,
  period_end    date,
  summary       text,
  overall_rating smallint check (overall_rating between 1 and 5),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists performance_reviews_internship_idx
  on public.performance_reviews (internship_id);
```

Distinct from per-report `mentor_feedback`: reviews span a period, not a single
week.

## Consequences

- New features ship as migrations that **add** objects; the MVP tables and their
  data are never at risk during evolution.
- Each new table reuses the established conventions (UUID PKs, UTC timestamps,
  `created_at`/`updated_at`, `deleted_at`, partial unique indexes, FK indexes) and
  will get its own RLS policies mirroring the admin/mentor/intern model.
- The `internships` hub and `weekly_reports` tree stay the stable join spine, so
  analytics and RLS predicates extend rather than fork.
- The polymorphic `attachments` option needs application-level integrity for
  `attachable_id` (no FK); flagged so the trade-off is a conscious choice at
  build time.

## Alternatives considered

- **Wide, sparse tables** (adding many nullable columns to `weekly_reports`/
  `internships` for every feature) — rejected; bloats the hot tables and their
  indexes, and couples unrelated features.
- **Rework the schema per feature** — rejected outright; the whole point of this
  ADR is that evolution is additive.
- **JSONB catch-all columns for future data** — usable for loose payloads
  (`notifications.payload`, `burnout_signals.factors`) but rejected as the general
  strategy; first-class relational tables keep analytics queryable and typed.
