# Altiora — Architecture

Altiora is an **Internship Intelligence Platform** for Callour Studio. It helps
mentors monitor intern growth and turns weekly reflection data into
organizational insight.

This document is the map of the codebase. It is kept current as phases land.

---

## Tech stack

| Concern       | Choice                                             |
| ------------- | -------------------------------------------------- |
| Framework     | Next.js 16 (App Router, RSC, Server Actions)       |
| Language      | TypeScript (strict)                                |
| Styling       | Tailwind CSS v4 (CSS-first tokens)                 |
| UI primitives | shadcn/ui (`base-nova` style) + Lucide icons       |
| Animation     | Framer Motion (subtle only)                        |
| Forms         | React Hook Form + Zod                              |
| Charts        | Recharts                                           |
| Toasts        | Sonner                                             |
| Theming       | next-themes (class strategy, dark mode)            |
| Backend       | Supabase (Postgres + Auth, Google OAuth) — Phase 3 |
| Data access   | `DataSource` interface — mock now, Supabase later  |

> **Next 16, not 15:** `create-next-app@latest` ships Next 16 as of mid-2026.
> It is a superset of the Next 15 App Router the brief specified — same RSC and
> Server Action model — so we build on the current stable.

---

## The data layer (mock → Supabase in one switch)

The single most important architectural decision: **no feature ever imports
Supabase directly.** Everything reads and writes through a `DataSource`
interface (added in Phase 2).

```
features / dashboards / weekly-report
                │
                ▼
        services/data-source.ts        ← the interface (contract)
                │
        ┌───────┴────────┐
        ▼                ▼
  MockDataSource    SupabaseDataSource
  (in-memory,        (@supabase/ssr,
   seeded)            added Phase 3+)
```

`getDataSource()` reads `NEXT_PUBLIC_DATA_SOURCE` (`mock` | `supabase`) and
returns the right implementation. To go live tomorrow:

1. Set `NEXT_PUBLIC_DATA_SOURCE=supabase` in `.env.local`.
2. Add the Supabase URL + keys.
3. Run `supabase/schema.sql` then `supabase/seed.sql`.

No feature code changes. That is the whole point of the abstraction.

---

## Folder structure

```
app/                      # Routes (App Router)
  (auth)/                 # Public auth routes            — Phase 3
  (app)/                  # Authenticated shell + pages   — Phase 4+
  layout.tsx              # Root layout (Inter, metadata)
  globals.css             # Tailwind v4 + design tokens

components/
  ui/                     # shadcn primitives
  layout/                 # Sidebar, topbar, nav, mobile nav — Phase 4
  shared/                 # PageHeader, EmptyState, StatCard, skeletons

features/                 # Feature-first modules (self-contained)
  weekly-report/          # THE MVP feature — Phase 5
    components/           # One component per report section
    hooks/                # useAutosave, useUnsaved, …
  dashboard/
    intern/ mentor/ admin/ # Role-specific dashboards — Phase 6
  reports/                # Report list + detail + feedback

lib/                      # Framework-agnostic helpers
  constants.ts            # App name, routes
  utils.ts                # cn(), formatting
  week.ts                 # ISO week helpers                 — Phase 2
  domain.ts               # Enum labels / option lists        — Phase 2
  insights.ts             # Derived metrics (streak, %, avgs)  — Phase 6

hooks/                    # Cross-feature React hooks
types/                    # database.ts (DB row types), domain.ts
services/                 # DataSource contract + implementations + mock seed
supabase/                 # client/server/middleware factories, schema.sql, seed.sql
schemas/                  # Zod schemas (shared client + server)
```

### Rules

- **Pages stay thin.** A route composes feature components; business logic lives
  in `features/*` and `services/*`.
- **Validation is shared.** One Zod schema per feature in `schemas/`, used by
  both React Hook Form (client) and Server Actions (server).
- **Derived data is never stored.** Streaks, completion %, and averages are pure
  functions in `lib/insights.ts`.
- **Server-first.** Reads happen in Server Components; mutations are Server
  Actions. Client components only where interactivity demands it.

---

## Build phases

The MVP is complete. Phases 3–4 were reordered (design system before auth) at the
product owner's request.

1. ✅ Product architecture & folder structure
2. ✅ Database schema & domain models (+ DataSource abstraction)
3. ✅ Design system & app shell
4. ✅ Authentication & user roles (mock-first; Supabase-ready)
5. ✅ Weekly Report feature (MVP flagship)
6. ✅ Dashboards (intern growth · mentor coaching · admin insights)
7. ✅ Analytics & charts (lib/insights + themed Recharts)
8. ✅ Polish — motion, states, responsive, a11y, dark mode

See `docs/FINAL_REPORT.md` for the full account and `docs/PRODUCT_IDEAS.md` for
the roadmap of ideas discovered along the way.
