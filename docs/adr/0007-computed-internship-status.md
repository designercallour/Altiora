# ADR-0007 — Internship status is computed from the period, never stored

**Status:** Accepted

## Problem

An internship's status (Active vs. Inactive) drives three things: platform
**access**, dashboard **metrics**, and admin **filtering**. The original schema
stored a 5-value `internship_status` enum (`upcoming/active/paused/completed/
terminated`) that an admin (or code) had to keep in sync with reality. Stored
status is a classic source of drift: an internship that ended yesterday still
reads `active` until someone updates it, silently granting access and polluting
metrics. It also forces manual lifecycle management ("activate this intern"),
which does not scale across many cohorts over many years.

## Decision

**Status is derived, at read time, purely from the internship period.** The
period (`start_date`, `end_date`) is the single source of truth.

- `lib/internship.ts` → `internshipLifecycle(period, now)` returns
  `{ status: "active" | "inactive", phase, daysRemaining, weeksRemaining,
  progress, … }`.
- **Active ⇔ today ∈ [start_date, end_date]** (inclusive). Everything else
  (upcoming, completed, unscheduled) is Inactive. `phase` carries the finer
  distinction for human-facing copy.
- The product exposes **only two statuses**. There is no UI to edit status.
- Access control (`app/(app)/layout.tsx`, the submit action) and metrics call
  the computed helper — never a stored column.

## Alternatives considered

1. **Keep the stored enum, update via cron/trigger.** Rejected: adds moving
   parts (a scheduler), still drifts between runs, and encodes "now" into data
   that is inherently time-relative.
2. **Stored boolean `is_active` maintained by the app.** Rejected: same drift
   problem, plus every date edit must remember to recompute it.
3. **Computed Postgres column.** Not portable to the mock data source, and
   `now()` in a generated column is not allowed (immutability). Computing in the
   shared domain layer keeps mock and Supabase identical.

## Trade-offs

- **Pro:** zero drift, zero manual lifecycle ops, one definition used by mock +
  Supabase + every surface. Editing the period is the *only* lever.
- **Con:** status can't be filtered in a raw SQL `WHERE` without also passing
  dates; list endpoints compute status in the app after fetching. At Altiora's
  scale (hundreds of internships) this is negligible; if it ever matters we can
  add a date-range index and filter on `start_date <= today <= end_date`.
- The legacy `internships.status` column is now **unused** (left in place to
  avoid a destructive migration; slated for removal in a later cleanup).
