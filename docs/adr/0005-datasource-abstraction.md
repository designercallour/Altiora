# ADR-0005 — DataSource abstraction over the backend

**Status:** Accepted

## Context

Altiora is built in phases: the UI and features land before the live Supabase
backend (see `ARCHITECTURE.md`). We need features to be fully buildable and
testable against seeded data now, then switch to Supabase later without rewriting
feature code. Scattering `@supabase/*` imports through features would couple every
screen to the backend and make the mock phase impossible to sustain.

## Decision

All features talk to a single **`DataSource` interface**
(`services/data-source.ts`) — the one seam between features and the backend. Two
implementations satisfy it:

- **`MockDataSource`** — in-memory, seeded; the default for early phases.
- **`SupabaseDataSource`** — `@supabase/ssr`-backed; added Phase 3+.

`getDataSource()` (via `services/index.ts`) reads the `NEXT_PUBLIC_DATA_SOURCE`
env var (`mock` | `supabase`) and returns the right implementation. **No feature
imports Supabase or the mock modules directly** — they import only from the
contract. The interface speaks the camelCase `types/domain.ts` model; the
`SupabaseDataSource` maps snake_case DB rows to it, so features never see database
naming.

## Consequences

- **Mock → live is a one-env-var change**: set `NEXT_PUBLIC_DATA_SOURCE=supabase`,
  add the Supabase URL + keys, run `schema.sql` then `seed.sql`. No feature code
  changes.
- Features are testable against deterministic seeded data with no network.
- The interface is the contract both implementations must honor; the input DTOs
  (`ReportInput`, `ReportUpdate`, `FeedbackInput`, `ReportQuery`, `InternQuery`)
  are defined once and shared.
- Cost: every backend capability must be expressed on the interface, and the mock
  must stay behavior-compatible with Supabase (especially around RLS-equivalent
  visibility). This discipline is the price of the seam.

## Alternatives considered

- **Import the Supabase client directly in features** — rejected; couples every
  screen to the backend and blocks the mock-first phase plan.
- **An ORM/repository per entity** — heavier abstraction than needed; the single
  `DataSource` facade matches the app's query patterns and read models
  (`WeeklyReportDetail`, `InternSummary`) directly.
- **Build against Supabase from day one** — rejected; would gate all UI work on
  backend readiness and make local/offline development and tests slow and flaky.
