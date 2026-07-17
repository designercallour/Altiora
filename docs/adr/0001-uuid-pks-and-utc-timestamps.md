# ADR-0001 — UUID primary keys, UTC timestamps, audit columns, soft delete

**Status:** Accepted

## Context

Altiora runs on Supabase (Postgres) behind a serverless Next.js app, with a mock
data source used before the live backend. We need identifier and temporal
conventions that hold across both, that are safe to generate outside a single
authoritative sequence, and that preserve history for an analytics product.

## Decision

Applied uniformly across all 14 tables (`supabase/schema.sql`):

- **UUID primary keys** — `id uuid primary key default gen_random_uuid()` (from
  the `pgcrypto` extension). IDs can be minted client-side or in the mock source
  without coordinating a sequence, and they leak no row counts or ordering.
- **UTC `timestamptz`** — every timestamp column is `timestamptz` stored in UTC;
  calendar values (`start_date`, `end_date`) are `date`. The app renders local
  time; storage is unambiguous.
- **`created_at` + `updated_at` on every table** — both `timestamptz not null
default now()`. `updated_at` is maintained by the shared trigger
  `public.set_updated_at()`, attached to all tables via a `before update` loop —
  the app never sets it.
- **`deleted_at` soft delete** — on all mutable domain tables. Rows are retired,
  not destroyed; live queries filter `where deleted_at is null`. Uniqueness is
  enforced by **partial unique indexes** scoped to live rows, so a soft-deleted
  slug/email/period can be reused.

## Consequences

- History is retained for analytics; nothing is lost to a delete.
- Uniqueness reasoning always carries the `where deleted_at is null` qualifier —
  developers must remember it in ad-hoc queries.
- UUIDs are wider than `bigint` and not monotonic, so index locality is worse;
  acceptable at Altiora's scale and mitigated by targeted indexes.
- `weekly_skill_scores` intentionally omits `deleted_at` — scores are replaced
  wholesale per report, so its unique index `(report_id, skill_id)` is
  unconditional.

## Alternatives considered

- **`bigint` identity PKs** — better index locality, but requires a central
  sequence (awkward for the mock source and client-minted rows) and leaks counts.
- **`timestamp` without time zone** — rejected; invites off-by-timezone bugs.
- **Hard deletes** — simpler, but destroys the longitudinal data the product
  exists to analyze.
- **`ULID`/`KSUID`** — sortable IDs, but add a dependency and buy little here;
  ordering needs are served by `created_at` and the `year, week_number` columns.
