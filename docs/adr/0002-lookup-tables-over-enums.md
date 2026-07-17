# ADR-0002 — Lookup tables for org dimensions, enums only for fixed sets

**Status:** Accepted

## Context

Altiora's analytics slice along many dimensions: department, team, cohort,
project, skill, skill category, learning category, learning source. These are
things the organization curates and evolves — new skills get added, a source is
renamed, a department is reorganized. Separately, a handful of values encode
system state that the code depends on and that essentially never changes.

Postgres offers two ways to model a constrained set: a **lookup table** (FK to a
row) or a **native `enum` type**. Adding or renaming an enum value requires a DDL
migration and cannot happen inside a normal transaction cleanly; a lookup row is
plain DML.

## Decision

- **Lookup/master tables** for every org-managed dimension:
  `departments`, `teams`, `cohorts`, `projects`, `skill_categories`, `skills`,
  `learning_categories`, `learning_sources`. Each has a UUID PK, `name`, `slug`,
  `sort_order` where display order matters, timestamps, and `deleted_at`.
  Referenced by FK from `internships`, `weekly_skill_scores`, and `learning_logs`.
- **Postgres enums** only for values that are fixed and depended on by
  RLS/state-machines: `user_role` (`admin`, `mentor`, `intern`),
  `internship_status` (`upcoming`, `active`, `paused`, `completed`,
  `terminated`), `report_status` (`draft`, `submitted`).

## Consequences

- Admins add/rename/reorder skills, sources, cohorts, etc. through data — no
  migration, no deploy. Renames preserve history because analytics join on the
  UUID, not the label.
- Analytics dimensions are extensible: a new `learning_source` is one insert and
  it immediately participates in effectiveness reporting.
- Enum columns stay small, self-documenting, and index-friendly, and give the
  state machines (`internship_status`, `report_status`) and RLS (`user_role`) a
  compile-time-stable vocabulary.
- Slight query overhead: dimension labels require a join. Mitigated by FK indexes
  and the fact that lookups are small and cache well (loaded once as `Lookups`).

## Alternatives considered

- **Enums for everything** — rejected; renaming a skill or adding a learning
  source would be a schema migration, which is unacceptable for user-curated
  analytics dimensions.
- **Lookup tables for everything, including role/status** — rejected for the
  fixed sets: RLS and state-machine code would take a join to resolve a value
  that never changes, adding latency for no flexibility (see ADR-0003).
- **Free-text columns** — rejected; no referential integrity, dirty analytics
  from typos and inconsistent casing.
