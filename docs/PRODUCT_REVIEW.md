# Product Review & Refinement

A founding-team review of Altiora after MVP completion, reviewing every flow as
if shipping to every intern and mentor at Callour tomorrow. Each finding lists
the problem, the decision, and the trade-off.

---

## Review lens: "Would this help me every week?"

Altiora is an operating system for internship programs, not a reporting tool.
Every screen was re-judged against whether it drives a better decision or a
calmer, more motivating weekly ritual — decorative output was removed or
reframed.

---

## Shipped improvements

### 1. Honest health metrics (Admin + Mentor) — _decision quality_

**Problem.** Both the Admin "Weekly completion" and the Mentor "Reflected this
week" counted the **current, in-progress week**. Mid-week that reads as `0%` /
`0/5` — alarming and useless, because nobody is expected to have submitted yet.

**Decision.** Base both signals on the **last completed ISO week**, scoped to
**active** internships only (completed cohorts shouldn't drag the number down).

- Admin: "Reflection rate" = active interns who reflected last week ÷ active
  interns.
- Mentor: "Reflected last week X/Y" + a "Behind" list of interns who missed the
  last completed week (a real, actionable coaching signal) — replacing "Yet to
  reflect this week", which was noise early in the week.

**Trade-off.** Slightly less "live"; far more truthful and decision-useful. A
mentor now sees exactly who to nudge, not a scary count that resets every Monday.

### 2. Skill ratings prefill from last week — _reflection quality + less friction_

**Problem.** New weekly reports seeded all eight skill ratings to a neutral `3`.
That is data noise, makes week-over-week skill deltas meaningless, and forces
re-rating from scratch every week.

**Decision.** A brand-new report now **prefills skill ratings from the intern's
previous submitted week** (falling back to `3` for the very first report). The
intern nudges what changed instead of starting cold.

**Trade-off.** Introduces mild anchoring bias, but continuity and meaningful
growth curves are worth far more than a blank slate — and it removes real
weekly friction. Implemented in `defaultFormValues(skillIds, priorScores)` +
`reports/new`.

### 3. Loading experiences — _perceived performance_

Added route-level `loading.tsx` skeletons for `/reports` and `/reports/[id]`
(the dashboard already had one) so navigation never flashes a blank screen —
skeletons mirror the final layout to avoid shift.

### 4. Accessibility pass — _inclusion_

- **Charts are now `role="img"` with self-describing `aria-label`s** (e.g.
  "Trend across 10 points, from 4 to 9") so screen-reader users get the insight,
  not silence.
- **Skip-to-content link** in the app shell (visible on focus) for keyboard
  users, with `main#main-content` as the target.
- (Existing: radiogroups for mood/ratings, visible focus rings unified to
  `ring-ring/50`, `aria-live` on autosave + mood, focus-trapped dialogs.)

### 5. Command palette actions — _speed_

⌘K now leads with an **Actions** group ("Start weekly report"), not just
navigation — the most common intent is one keystroke away.

---

## Flow-by-flow verdict

| Flow             | Verdict after review                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Login            | Calm, on-brand; dev persona switcher makes multi-role review effortless.                                                                   |
| Intern dashboard | Growth workspace — streak, confidence/mood trends, skill radar, learning mix, mentor feedback. Reflection-first, not KPI-heavy.            |
| Weekly Report    | 6-step wizard, autosave, drafts, prefilled skills, review, celebration. The flagship — delightful.                                         |
| Learning Log     | First-class multi-item editor with category/source/project + 1–5 scales.                                                                   |
| Mentor feedback  | Inline on the report; feedback + next goal + rating; revalidates instantly.                                                                |
| Mentor dashboard | Coaching queue (needs feedback) + who's behind + roster. Actionable.                                                                       |
| Admin dashboard  | Only decision-useful insights: reflection rate, cohort comparison, source effectiveness, strongest skills, learning mix, confidence trend. |
| Settings         | Profile + theme + notification preview. Clear and honest.                                                                                  |
| Navigation       | Sidebar + ⌘K + breadcrumbs + mobile sheet — one consistent model.                                                                          |

---

## Quality checklist

| Check              | Status                                                           |
| ------------------ | ---------------------------------------------------------------- |
| Typecheck          | ✅ clean                                                         |
| Lint               | ✅ 0 errors (1 benign React-Compiler note on RHF `watch()`)      |
| Build              | ✅ 12 routes                                                     |
| Responsive         | ✅ mobile sheet nav; desktop fixed sidebar                       |
| Accessibility      | ✅ skip link, chart labels, radiogroups, focus rings, aria-live  |
| Dark mode          | ✅ verified across dashboards                                    |
| Empty states       | ✅ every list/section                                            |
| Loading states     | ✅ dashboard + reports + report detail skeletons                 |
| Error states       | ✅ route error boundary + ErrorState                             |
| Copy consistency   | ✅ warm, reflection-first voice throughout                       |
| Design consistency | ✅ tokens only; unified accent + focus + shadow                  |
| Performance        | ✅ RSC-first; charts are the only client-heavy leaves            |
| Architecture       | ✅ DataSource abstraction intact; features never import Supabase |

---

## Notes for the next pass

- Replace `SupabaseDataSource` stub with the real implementation once
  credentials land (schema/seed already written).
- Add tests: unit for `lib/insights.ts`, e2e for the Weekly Report submit flow.
- See `docs/PRODUCT_IDEAS.md` for the opportunity backlog (AI summaries, burnout
  detection, goal tracking, knowledge base).
