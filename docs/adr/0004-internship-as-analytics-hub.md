# ADR-0004 — `internships` as the analytics hub; reports reference it

**Status:** Accepted

## Context

Weekly reports are the core reflection unit. The naive model attaches a report
directly to a `user_id`. But Altiora's value is analytics _across context_: by
mentor, cohort, department, team, and project. A bare `user_id` on a report knows
none of that — it would force every analytics query to re-derive "who was this
person's mentor / cohort / project at the time of this report", which is
ambiguous the moment a person has more than one engagement.

We also need to support a person holding **multiple internships** (a returning
intern, a second cohort, a different department) with independent report streams.

## Decision

`internships` is the central entity — one row per intern-per-engagement — and it
binds all context in one place:

```sql
user_id       -- the intern
mentor_id     -- assigned mentor
cohort_id
department_id
team_id
project_id    -- primary project
position, start_date, end_date, status
```

**`weekly_reports.internship_id` references `internships`, not `users`.** Every
report therefore inherits mentor, cohort, department, team, project, and duration
transitively through its internship. Report children (`weekly_skill_scores`,
`learning_logs`, `mentor_feedback`) hang off the report and inherit the same
context.

## Consequences

- Cross-cutting analytics (mentor growth, cohort comparison, department outcomes,
  project-attributed learning) are joins through one table, not denormalized
  copies on every child.
- A person can have multiple internships; each keeps a correct, independent report
  stream. The uniqueness rule is per engagement:
  `weekly_reports (internship_id, year, week_number) where deleted_at is null`.
- Context is correct _as of the engagement_: reassigning a mentor updates
  `internships.mentor_id` and every report follows automatically.
- RLS is clean: intern and mentor visibility both derive from `internships`
  (`user_id` / `mentor_id`), and report-child policies reuse `owns_report()` /
  `mentors_report()` which join back through the internship.
- Slight indirection: reaching the intern from a report is a two-hop join
  (`weekly_reports → internships → users`). Indexed and cheap.

## Alternatives considered

- **`weekly_reports.user_id` directly** — rejected; loses engagement context,
  can't represent multiple internships per person, and pushes context re-
  derivation into every analytics query.
- **Denormalize mentor/cohort/dept onto each report** — rejected; write
  amplification and drift when an assignment changes, plus stale historical rows.
- **Snapshot context onto the internship only, reports point at user** — rejected;
  still can't disambiguate which engagement a given week belongs to.
