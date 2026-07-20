# ADR-0009 — Mentor assignment: current pointer + history table

**Status:** Accepted

## Problem

The spec requires: one mentor supervises many interns; one intern has exactly
one *active* mentor; the mentor can change over time; and **history must be
preserved for audit** ("who mentored this intern, and when"). We need both a
fast answer to "who is this intern's mentor right now?" and a durable record of
every past supervision span.

## Decision

Two representations, kept in sync by the DataSource:

1. **Current pointer** — `internships.mentor_id`. A single indexed column that
   answers "current mentor" in every list/detail query with no join. This is the
   source of truth the app reads for the live relationship, and what mentor-scoped
   RLS keys off.
2. **History table** — `public.mentor_assignments`: one row per supervision
   span (`internship_id`, `mentor_id`, `assigned_by_id`, `note`, `started_at`,
   `ended_at`). The **current** span is the one with `ended_at = null`, enforced
   unique by a partial index (`mentor_assignments_one_open_key`) so an internship
   can never have two open mentors.

`assignMentor(internshipId, mentorId, opts)` is the single write path: it closes
the open span (`ended_at = now`), opens a new one, and updates the pointer — in
both the mock and Supabase implementations. Reads of history use
`listMentorAssignments`, which resolves each span's mentor for timeline display.

## Alternatives considered

1. **Pointer only (no history).** Rejected — loses the audit trail the spec
   requires; a reassignment would silently erase who came before.
2. **History only, derive current from the open span.** Rejected — every
   "current mentor" read (intern lists, dashboards, RLS predicates) would need a
   subquery/join on `ended_at is null`. The denormalized pointer keeps hot paths
   cheap; the partial unique index guarantees the two never diverge.
3. **Soft-delete assignment rows instead of `ended_at`.** Rejected — "ended" is
   a real domain event (supervision concluded), not a deletion; `ended_at`
   carries *when*, which the audit needs.

## Trade-offs

- **Pro:** O(1) current-mentor reads, full history, single write path, DB-level
  guarantee of one active mentor per intern.
- **Con:** two things to keep consistent — mitigated by routing every change
  through `assignMentor` and the partial unique index.
- **Backfill:** migration 0003 seeds an open span for every existing internship
  that already has a `mentor_id`, so history is complete from day one.
