# Altiora — Final Report

Internship Intelligence Platform · Callour Studio

---

## Overview

**Altiora** is an internship intelligence platform. It exists to turn the weekly
self-reflection of interns into growth — for the intern first, and for the
organization second. It is deliberately **reflection-first, not a reporting
tool**: the primary object is a thoughtful weekly reflection (mood, what was
learned, how confidence is shifting), and analytics are derived from that honest
signal rather than imposed as top-down KPIs. The name — Latin _altiora_, "higher
things" — and the upward-chevron mark set the intent: the product is about
people climbing, not dashboards for their own sake.

**The MVP is complete.** The **Weekly Report** is the one feature built
end-to-end — authoring wizard, autosave, validation, submission, detail view,
list, edit, and mentor feedback. The **Insights** and **Feedback** pages are
intentional, first-class **Coming Soon** screens: their information architecture,
navigation, and data model are in place, but the pages are scoped out of the MVP
on purpose rather than left as broken links. This keeps the MVP honest — one
feature done properly, and a clear, deliberate frontier.

The stack is Next.js 16 (App Router, RSC, Server Actions) + React 19 +
TypeScript (strict) + Tailwind v4 + shadcn/ui on Base UI, Supabase-ready but
**mock-first**: the entire app runs today with zero backend, and going live is a
single environment-variable switch.

---

## What was implemented

### Phase 1 — Scaffold & architecture

- Next.js 16 + React 19 + TypeScript (strict) + Tailwind v4, managed with
  **pnpm** (`packageManager: pnpm@11.12.0`, Node ≥ 20).
- **Feature-folder architecture**: routes in `app/` stay thin and compose
  self-contained modules in `features/*`; framework-agnostic logic lives in
  `lib/*`; the data contract lives in `services/*`. Rules are documented in
  [`ARCHITECTURE.md`](../ARCHITECTURE.md).
- Tooling: ESLint (`eslint-config-next`), Prettier with the Tailwind plugin,
  `typecheck`/`lint`/`format` scripts.

### Phase 2 — Database schema & domain models

- **Postgres schema** ([`supabase/schema.sql`](../supabase/schema.sql)) —
  **14 tables**, **3 enums** (`user_role`, `internship_status`,
  `report_status`), organized hub-and-spoke:
  - **Lookup/master tables** (`departments`, `teams`, `cohorts`, `projects`,
    `skill_categories`, `skills`, `learning_categories`, `learning_sources`)
    describe org-managed analytics dimensions.
  - **`users`** mirrors `auth.users`, enriched with an app role.
  - **`internships`** is the analytics hub: one row per intern-per-engagement,
    binding intern → mentor, cohort, department, team, project, position,
    duration, status.
  - **`weekly_reports`** and its children (`weekly_skill_scores`,
    `learning_logs`, `mentor_feedback`).
  - Conventions: **UUID PKs**, **RLS** with `SECURITY DEFINER` helper functions,
    **soft delete** (`deleted_at`), all timestamps **UTC** (`timestamptz`).
- **Reproducible seed** ([`supabase/seed.sql`](../supabase/seed.sql)) —
  10 interns, 2 mentors, 2 cohorts, ~100 weekly reports, ~800 skill scores,
  ~500 learning logs, ~90 feedback rows. Deterministic and re-runnable.
- **TypeScript domain models** — [`types/domain.ts`](../types/domain.ts)
  (app-facing types) and [`types/database.ts`](../types/database.ts) (DB row
  types).
- **The `DataSource` abstraction** ([`services/`](../services/)) — the single
  most important architectural move (see below). `MockDataSource`
  ([`services/mock/mock-data-source.ts`](../services/mock/mock-data-source.ts))
  is a deterministic, seeded generator (a small PRNG in
  [`services/mock/prng.ts`](../services/mock/prng.ts) +
  [`services/mock/generate.ts`](../services/mock/generate.ts) +
  [`services/mock/reference-data.ts`](../services/mock/reference-data.ts));
  `SupabaseDataSource`
  ([`services/supabase-data-source.ts`](../services/supabase-data-source.ts)) is
  a stub; [`getDataSource()`](../services/index.ts) selects by
  `NEXT_PUBLIC_DATA_SOURCE`.

### Phase 3 — Design system & app shell

- **Tokens** in [`app/globals.css`](../app/globals.css): cool-tinted **OKLCH**
  neutrals (hues ~283–286) with a single **iris** accent, layered low-opacity
  shadows, motion easings mirrored in [`lib/motion.ts`](../lib/motion.ts), Inter
  as the primary typeface, full light/dark palettes. Documented in
  [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).
- **App shell** ([`components/layout/`](../components/layout/)):
  `Sidebar`, `Topbar`, `MobileNav`, `Breadcrumbs`, `CommandMenu` (⌘K),
  `ThemeToggle`, `UserMenu`, composed by `AppShell`.
- **Reusable components** ([`components/shared/`](../components/shared/)):
  `PageContainer`, `PageHeader`, `SectionHeader`, `StatCard`, `InsightCard`,
  `EmptyState`, `ErrorState`, `ComingSoon`, `skeletons`, motion primitives
  (`motion.tsx`), `LinkButton`.
- Dark mode via `next-themes` (class strategy).

### Phase 4 — Authentication & roles

- **Mock-first Google auth architecture**: the flow, guards, and session shape
  are real; the identity provider is mocked so the app runs credential-free.
- `@supabase/ssr` client/server factories
  ([`supabase/client.ts`](../supabase/client.ts),
  [`supabase/server.ts`](../supabase/server.ts)) +
  [`proxy.ts`](../proxy.ts) route guard — **Next 16 renamed `middleware` →
  `proxy`**; the guard logic lives in
  [`supabase/middleware.ts`](../supabase/middleware.ts).
- [`lib/session.ts`](../lib/session.ts) `getCurrentUser()`, backed by a
  cookie-based mock session.
- Login page ([`app/(auth)/auth/login/page.tsx`](<../app/(auth)/auth/login/page.tsx>))
  with a Google button
  ([`features/auth/google-sign-in-button.tsx`](../features/auth/google-sign-in-button.tsx))
  and a **dev persona switcher**; sign-out and **dev role switching** in the
  user menu. Auth actions in [`features/auth/actions.ts`](../features/auth/actions.ts).

### Phase 5 (flagship) — Weekly Report

- **6-step wizard** ([`features/weekly-report/components/report-wizard.tsx`](../features/weekly-report/components/report-wizard.tsx)):
  mood → reflection → learning → skills → confidence → review.
- Section components: `MoodPicker`, `ScaleField` (sliders), `RatingScale`,
  `LearningLogEditor` (multiple learning logs via a dialog),
  `AutosaveIndicator`, `ReportSuccess` — all under
  [`features/weekly-report/components/`](../features/weekly-report/components/).
- **`useAutosave` hook** ([`hooks/use-autosave.ts`](../hooks/use-autosave.ts)):
  debounced draft save with a "Saved" indicator.
- **Zod validation** ([`schemas/weekly-report.ts`](../schemas/weekly-report.ts))
  with **per-step gating** and a **strict submit schema**, shared by React Hook
  Form and the Server Action.
- **Deterministic post-submit redirect** to a **celebration success state**
  (server action in
  [`features/weekly-report/actions.ts`](../features/weekly-report/actions.ts)).
- Report **detail view** (`ReportView`,
  [`features/reports/components/report-view.tsx`](../features/reports/components/report-view.tsx)),
  **list** ([`app/(app)/reports/page.tsx`](<../app/(app)/reports/page.tsx>)),
  and **edit-draft** route
  ([`app/(app)/reports/[id]/edit/page.tsx`](<../app/(app)/reports/[id]/edit/page.tsx>)).

### Phase 6 — Role-aware dashboards

[`features/dashboard/`](../features/dashboard/), routed through
[`app/(app)/dashboard/page.tsx`](<../app/(app)/dashboard/page.tsx>):

- **Intern** (`intern/intern-dashboard.tsx`) — a **growth workspace**, not a KPI
  wall: streak, confidence trend, skill radar, mood trend, learning
  distribution, latest feedback, recent reflections.
- **Mentor** (`mentor/mentor-dashboard.tsx`) — a **coaching surface**: feedback
  queue, who reflected / who's missing this week, intern roster.
- **Admin** (`admin/admin-dashboard.tsx`) — org insights.

### Phase 7 — Analytics & charts

- **Pure functions** in [`lib/insights.ts`](../lib/insights.ts): streak,
  averages, trends, skill deltas, source effectiveness, distributions. Derived
  data is computed, never stored.
- **Themed Recharts primitives**: `TrendChart` (area) and `SkillRadar`
  ([`components/charts/`](../components/charts/)), plus a CSS `BarList`
  ([`components/shared/bar-list.tsx`](../components/shared/bar-list.tsx)).
- Dashboards answer real questions: learning by category, source effectiveness,
  cohort comparison, confidence trend, top skills, weekly completion.
- **Mentor feedback flow** — form
  ([`features/reports/components/mentor-feedback-form.tsx`](../features/reports/components/mentor-feedback-form.tsx))
  - server action ([`features/reports/actions.ts`](../features/reports/actions.ts),
    schema [`schemas/feedback.ts`](../schemas/feedback.ts)) on the report detail.

### Phase 8 — Polish

Motion; empty/loading/error states (`loading.tsx`, `error.tsx`, `not-found.tsx`);
responsive (mobile sheet nav); accessibility (radiogroups, focus-visible rings,
`aria-live`, labels, full keyboard support); dark mode; strict token
consistency (no hardcoded colours, shadows, or easings).

---

## Architecture decisions & trade-offs

**Mock-first `DataSource` abstraction.**
No feature ever imports Supabase directly; everything reads and writes through
the `DataSource` interface, and `getDataSource()` picks the implementation from
`NEXT_PUBLIC_DATA_SOURCE`. _Why:_ it lets the whole product be built, demoed, and
reviewed with zero backend, and makes mock → Supabase a **one-env-var switch**
plus running `schema.sql`/`seed.sql` — no feature code changes. _Trade-off:_ the
mock must be kept faithful to the eventual Supabase queries, and the Supabase
implementation is deferred debt (below).

**Next.js 16 instead of the brief's 15.**
`create-next-app@latest` ships 16, which is a **superset** of the Next 15 App
Router the brief specified — identical RSC and Server Action model. _Why:_ build
on the current stable rather than pin to an older minor. _Trade-off:_ one
concrete rename to absorb — `middleware` → `proxy` (see below).

**shadcn `base-nova` style is built on Base UI, not Radix.**
The primitives in [`components/ui/`](../components/ui/) sit on
`@base-ui/react`. This is load-bearing for **all future component work**:
composition uses Base UI's **`render` prop**, _not_ Radix's `asChild`. Anyone
extending a primitive must reach for `render`.

**Role-as-enum, not a roles table.**
`user_role` is a Postgres enum on `users`. _Why:_ RLS policies check the role in
`SECURITY DEFINER` helpers, and an enum keeps those checks fast and the schema
simple. _Trade-off:_ fewer roles than a join table would allow — mitigated by a
documented **additive migration path** (introduce a `roles` table later without
breaking existing policies).

**`internships` as the analytics hub.**
`weekly_reports` anchor to `internship_id`, never a bare `user_id`. _Why:_ every
report inherits full org context (mentor, cohort, department, team, project), so
cross-cutting analytics are **joins, not a schema redesign**.

**Lookup tables for dimensions, enums only for fixed state.**
Org-managed dimensions (departments, skills, learning sources, …) are lookup
tables the org can grow; only genuinely fixed lifecycle state
(`report_status`, `internship_status`, `user_role`) is an enum.

**Deterministic post-submit redirect.**
On submit, the Server Action issues a `redirect` to a `?celebrate=1` success
screen rather than relying on client navigation. _Why:_ it avoids racing the
automatic route refresh after the mutation, which could otherwise flash a stale
or empty state before the celebration.

**`LinkButton` vs Base UI `Button`.**
Navigation uses a semantic `<a>` styled with `buttonVariants`
([`components/shared/link-button.tsx`](../components/shared/link-button.tsx)),
kept distinct from the Base UI `Button` used for real actions. _Why:_ correct
semantics (links navigate, buttons act) without visual divergence.

---

## Improvements beyond the brief

- **Dev persona switcher** on login + **dev role switching** in the user menu —
  demo any role instantly with no auth backend.
- **Celebration success state** after submitting a report.
- **Reflection-first dashboards** (growth workspace, not a KPI wall).
- **Source-effectiveness** and **cohort** analytics.
- **ISO-week model with year** ([`lib/week.ts`](../lib/week.ts)) — no ambiguity
  across year boundaries.
- **Autosave hook** with a Saved indicator.
- **Deterministic seeded mock** — same data every run, so reviews are stable.
- **Skill radar**, **breadcrumbs**, and a **⌘K command palette**.

---

## Known limitations

- **`SupabaseDataSource` is a stub.** It activates the moment credentials are
  added; the implementation phase is awaiting credentials.
- **Auth is mocked.** Real Google OAuth is wired (factories, `proxy.ts` guard,
  callback route) but inert without Supabase credentials.
- **Skill ratings default to 3.** Self-assessment starts mid-scale, which adds
  noise until an intern adjusts — a candidate for prefill (see recommendations).
- **"Weekly completion" reads 0% in mock.** The current week is intentionally
  left open in the seed, so completion for _this_ week is genuinely 0.
- **No tests yet.**
- **Charts are client-rendered** (Recharts).

---

## Technical debt

- **`SupabaseDataSource` implementation pending** — the stub must be filled in
  against `schema.sql`.
- **`types/database.ts` is hand-authored** — replace with
  `supabase gen types typescript` once the DB is live.
- **No automated tests.**
- **React Hook Form `form.watch()`** trips a **React Compiler
  "incompatible library" lint warning** — benign, but noisy.
- **`services/mock/reference-data.ts` and `supabase/seed.sql` are kept in sync
  by hand** — they should share a single source eventually.

---

## Future roadmap

1. **Implement `SupabaseDataSource`** and **connect Google OAuth** — flip
   `NEXT_PUBLIC_DATA_SOURCE=supabase`, run `schema.sql`/`seed.sql`.
2. **Insights page** — AI weekly summaries, burnout detection, mentor analytics,
   skill velocity.
3. **Feedback timeline & goal tracking.**
4. **Notifications** (streak nudges, weekly reminders).
5. **Tests** — unit for `lib/insights`, e2e for the wizard.
6. **Knowledge base** built from high-impact learning logs.

---

## Recommendations

- **Connect Supabase now**: add credentials, run
  [`supabase/schema.sql`](../supabase/schema.sql) then
  [`supabase/seed.sql`](../supabase/seed.sql), implement the data source.
- **Add tests** around [`lib/insights.ts`](../lib/insights.ts) and the report
  submit flow first — they carry the most logic and risk.
- **Add real avatars** (Google profile photos once OAuth is live).

## Post-MVP refinement pass

A founding-team refinement pass followed MVP completion — see
[`PRODUCT_REVIEW.md`](./PRODUCT_REVIEW.md). Highlights: honest last-completed-week
health metrics (Admin + Mentor), skill ratings now **prefill from the previous
week**, route-level loading skeletons for `/reports`, chart accessibility
(`role="img"` + summaries), a skip-to-content link, and a ⌘K "Start weekly
report" action.
