# Deploying Altiora

Ship the `weekly-report-intelligence` branch to production (Vercel + Supabase).

---

## 0. Preconditions (already done ✅)

- `pnpm build` passes locally.
- Work is committed on branch **`weekly-report-intelligence`** (2 commits).
- Base Supabase schema already applied earlier from `supabase/setup.sql`.

---

## 1. Push to GitHub  _(needs your GitHub auth)_

The repo has **no remote yet** and the `gh` CLI isn't installed, so this step is
yours. Two options:

**A. With the GitHub CLI (recommended)**
```bash
brew install gh          # if not installed
gh auth login            # pick GitHub.com → HTTPS → login in browser
gh repo create callour-studio/altiora --private --source=. --remote=origin --push
# then push the working branch + open a PR:
git push -u origin weekly-report-intelligence
gh pr create --base main --head weekly-report-intelligence \
  --title "Weekly report → qualitative reflection + AI Learning Intelligence" \
  --body-file docs/PR_BODY.md
```

**B. Without gh** — create an empty repo at https://github.com/new (no README),
then:
```bash
git remote add origin https://github.com/<you>/altiora.git
git push -u origin main                       # if main isn't up there yet
git push -u origin weekly-report-intelligence
# open the PR from the GitHub web UI (it will prompt after the push)
```

> A ready-to-paste PR description is in `docs/PR_BODY.md`.

---

## 2. Supabase migration  _(needs you: run SQL in the dashboard)_

Before pointing the app at Supabase, apply the new schema:

1. Open your project → **SQL Editor** →
   https://supabase.com/dashboard/project/lubahloibeborlmmrzxw/sql
2. Paste the contents of **`supabase/migrations/0001_review_and_intelligence.sql`**
   and **Run**. It is idempotent (safe to re-run). It adds:
   - `weekly_reports.reviewed_at` + the `wr_mentor_review` policy
   - the `report_intelligence` table + its RLS policies + trigger

That's the only DB change this release needs.

---

## 3. Deploy to Vercel  _(needs you: Vercel account + clicks)_

1. https://vercel.com/new → **Import** the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Root dir: repo root.
3. **Environment Variables** (Project Settings → Environment Variables) — add for
   **Production** (and Preview if you want previews to hit Supabase):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_DATA_SOURCE` | `supabase` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://lubahloibeborlmmrzxw.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | _your anon key_ |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-vercel-domain>` |
   | `ANTHROPIC_API_KEY` | _your Anthropic key_ (server-only — do **not** prefix with `NEXT_PUBLIC_`) |

4. Deploy. First deploy uses whatever branch you import; to ship this work, either
   merge the PR into `main` first, or set the Production Branch to
   `weekly-report-intelligence` temporarily.

### After the first deploy — wire up auth redirects
- **Supabase → Authentication → URL Configuration**: set **Site URL** to your
  Vercel domain and add `https://<your-vercel-domain>/auth/callback` to
  **Redirect URLs**.
- **Google OAuth**: add the same callback to the Google Cloud OAuth client's
  authorized redirect URIs (you likely already have the Supabase callback there).
- Update `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy if it changed.

---

## 4. Verify in production

1. Visit the deployed URL → sign in with Google.
2. As an **intern**: submit a weekly report (mood → 2× 300-char reflection →
   3 learnings → submit). On the report detail, the **Learning intelligence**
   card should appear.
   - With `ANTHROPIC_API_KEY` set, skills/concepts are Claude-generated (sharper
     than the local stub).
3. As the **mentor** of that intern: dashboard → the intern in **To review** →
   open their profile → open the week → **Mark as reviewed** → it clears from the
   queue.
4. As **admin**: dashboard shows Top skills / Emerging concepts and the Interns
   roster.

If extraction ever looks empty, check the Vercel **Functions logs** for the
submit action — on any Anthropic error the code silently falls back to the stub,
so a submit is never blocked.

---

## 5. Post-deploy backlog

- **Schema cleanup** (separate PR): drop the now-unused learning `category` /
  `source` / `project` / `difficulty` / `confidence` / `impact` / `applied`
  fields + their lookups. Destructive on live data — do it deliberately, later.
- **Automated tests** for extraction normalize/stub, `needsReview`, week gating.
