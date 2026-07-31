# Deployment pipeline

Production ships through **one** path: a merge to `main` triggers the
[`Migrate & Deploy`](../.github/workflows/deploy.yml) GitHub Actions workflow,
which applies Supabase migrations **first** and only deploys to Vercel if they
succeed. Vercel's own Git auto-deploy is disabled (`vercel.json` →
`git.deploymentEnabled.main = false`), so a build can never ship ahead of its
database schema.

```
merge to main → GitHub Actions:
   1. supabase db push   (migrations; fails the job on error)
   2. vercel deploy --prod  (only if step 1 passed)
   3. curl health check on the production URL
```

## One-time setup

### 1. GitHub Secrets
Add these under **Repo → Settings → Secrets and variables → Actions → New
repository secret** (or with `gh secret set <NAME>`):

| Secret | Where to get it |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens (personal access token) |
| `SUPABASE_DB_PASSWORD` | Supabase → Project → Settings → Database → Database password |
| `SUPABASE_PROJECT_REF` | Supabase → Project → Settings → General → Reference ID |
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link`, or Vercel team settings |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link`, or Vercel project settings |

To get the two Vercel IDs locally:

```bash
npx vercel@latest login
npx vercel@latest link      # select the Altiora project
cat .vercel/project.json    # → orgId, projectId  (do NOT commit this file)
```

### 2. Reconcile Supabase migration history (once)
Migrations `0001`–`0006` were applied to production **manually** before this
pipeline existed, so the CLI's remote history table may not list them. Sync it
once so `db push` treats them as already applied:

```bash
supabase link --project-ref <SUPABASE_PROJECT_REF>
supabase migration list            # see which are marked applied remotely
supabase migration repair --status applied 0001 0002 0003 0004 0005 0006
```

All migrations are idempotent (`if not exists` / `drop policy if exists`), so
even if the first CI run re-applies them, it is a safe no-op — the repair step
just keeps the history clean.

### 3. Merge order matters
The `vercel.json` change disables Vercel's auto-deploy. **Add the six secrets
first**, then merge the PR that introduces this workflow. If you merge before
the secrets exist, the workflow will fail at the migration step and nothing
deploys (production stays on its current version — no partial/outdated deploy).

## Adding a schema change later
1. `supabase migration new <name>` (or hand-author `supabase/migrations/NNNN_*.sql`).
2. Commit alongside the code that depends on it.
3. Open a PR, merge → the workflow applies the migration, then deploys, then
   health-checks. If the migration fails, the deploy never runs.
