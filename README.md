# Altiora

**Internship Intelligence Platform for Callour Studio.**

Altiora is not a weekly-report collector. It is a system for helping mentors
monitor intern growth while turning internship data into organizational insight
— think Linear + Notion + Lattice, with a reflective journal at its core.

Built to feel premium, minimal, calm, and delightful.

---

## Quick start

```bash
pnpm install
cp .env.example .env.local   # defaults to mock data — no backend needed
pnpm dev                     # http://localhost:3000
```

The app ships with **mock data on by default** (`NEXT_PUBLIC_DATA_SOURCE=mock`),
so it runs and every chart is populated without a database.

## Scripts

| Command          | Description                |
| ---------------- | -------------------------- |
| `pnpm dev`       | Start the dev server       |
| `pnpm build`     | Production build           |
| `pnpm start`     | Serve the production build |
| `pnpm lint`      | ESLint                     |
| `pnpm typecheck` | TypeScript, no emit        |
| `pnpm format`    | Prettier write             |

## Tech stack

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Framer Motion · React Hook
Form · Zod · Recharts · Supabase (Postgres + Google Auth).

## Going live with Supabase

The whole app talks to a `DataSource` interface, so switching backends is a
one-line change:

1. `NEXT_PUBLIC_DATA_SOURCE=supabase` in `.env.local`
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run `supabase/schema.sql`, then `supabase/seed.sql`

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design.

## Roles

**Admin** · **Mentor** · **Intern** — role-based auth (Google login only).

## What's built

- **Auth & roles** — Google-auth architecture (mock-first; Supabase-ready), a
  dev persona switcher to preview Intern / Mentor / Admin, route guards.
- **Weekly Report (flagship)** — a 6-step reflection wizard with mood, learning
  logs, skill ratings, autosave + drafts, validation, review, and a celebration
  success state.
- **Dashboards** — Intern (a personal growth workspace), Mentor (a coaching
  queue), Admin (organizational insights) — role-aware, reflection-first.
- **Analytics** — confidence/mood trends, skill radar, learning distribution,
  source effectiveness, cohort comparison — computed in `lib/insights.ts`.
- **Design system** — tokens, app shell, command palette (⌘K), dark mode.

Try it with the **dev persona switcher** on the login screen (mock mode).

## Roadmap

`Insights` (AI summaries, burnout detection, mentor analytics) and `Feedback`
(goal tracking, timeline) are intentional **Coming Soon** pages. See
[`docs/FINAL_REPORT.md`](./docs/FINAL_REPORT.md) and
[`docs/PRODUCT_IDEAS.md`](./docs/PRODUCT_IDEAS.md).
