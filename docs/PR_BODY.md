# Weekly report → qualitative reflection + AI Learning Intelligence

Reshapes the weekly report from rating-heavy forms into deep qualitative
reflection, and derives structured "learning intelligence" from that text with
Claude. Adds mentor/admin review flows and per-intern profiles.

## Highlights

**Weekly report wizard**
- 4 steps: Mood → Your work → What you learned → Review (removed Skill-growth and
  Wrapping-up/confidence steps).
- Reflection fields + each learning require a **300-character minimum** (live
  counter + gate).
- Mood picker: emoji tooltips, worst→best ordering, colour-coded on select.
- Learning entry is now just a deep-text description (dropped category/source/
  difficulty/confidence/impact inputs).

**AI Learning Intelligence**
- On submit, the reflection text → **Claude (Haiku 4.5)** → `{ summary, skills,
  concepts, learning_direction, next_topics }`, Zod-validated.
- Falls back to a deterministic offline **stub** when `ANTHROPIC_API_KEY` is
  absent, so the app works without a key and never blocks a submit.
- Persisted in mock (seeded) + Supabase (`report_intelligence` table + RLS).
- Dashboards show extracted **Top skills** / **Emerging concepts**; report detail
  shows a **Learning intelligence** card.

**Mentor / admin review**
- Mentors are review-only: feedback form → **Mark as reviewed** panel
  (`reviewed_at` on `weekly_reports`; `needsReview` keys off it).
- **Intern profile** page (`/interns/[id]`): overview, mood trend, aggregated
  skills, full week-by-week timeline with review status.
- Mentor + admin dashboards list interns (shared `InternRow`) → profiles.

**Dashboards & nav**
- Mood-centric charts (emoji Y-axis + tooltips, avg-mood label); dropped skill
  radar / confidence / cohort widgets.
- Role-aware nav (Weekly Reports intern-only); removed Insights/Feedback
  placeholders; trimmed Settings notifications.

## Migration

Run `supabase/migrations/0001_review_and_intelligence.sql` (idempotent) before
switching `NEXT_PUBLIC_DATA_SOURCE=supabase`. Adds `weekly_reports.reviewed_at`
and the `report_intelligence` table + policies.

## Config

Set `ANTHROPIC_API_KEY` (server-only) in the deploy env to enable real Claude
extraction. See `docs/DEPLOY.md`.

## Follow-ups (not in this PR)

- Schema cleanup: drop now-unused learning category/source/impact fields.
- Automated tests for extraction + review gating.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
