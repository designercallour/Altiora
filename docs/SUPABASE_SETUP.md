# Going live with Supabase

Altiora runs on a `DataSource` abstraction. Switching from the in-memory mock to
your real Supabase project is configuration + SQL — the `SupabaseDataSource`
implementation is already written and maps every query to your schema, enforced
by Row-Level Security.

> **Never paste your `service_role` key (or any secret) into a chat or commit.**
> Keys live only in `.env.local`, which is git-ignored. The running app never
> needs the service_role key — it uses the anon key + the signed-in user's
> session, and RLS does the rest.

---

## 1. Run the SQL (Supabase Dashboard → SQL Editor)

1. Paste and run [`supabase/schema.sql`](../supabase/schema.sql) — tables,
   enums, indexes, `updated_at` triggers, RLS policies, helper functions, and
   the `handle_new_user` trigger.
2. Paste and run [`supabase/seed.sql`](../supabase/seed.sql) — 13 users, 2
   cohorts, 10 internships, 100 reports, 800 skill scores, 500 learning logs,
   90 feedback entries.

## 2. Configure Google Auth (Dashboard → Authentication)

1. **Providers → Google:** enable it, paste your Google OAuth **Client ID** and
   **Client Secret** (from Google Cloud Console → Credentials → OAuth client).
   In Google Cloud, add this authorized redirect URI:
   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
2. **URL Configuration:**
   - **Site URL:** `http://localhost:3000` (and your production URL later).
   - **Redirect URLs:** add `http://localhost:3000/auth/callback` (+ prod).

## 3. Point the app at Supabase (`.env.local`)

Copy `.env.example` → `.env.local` and set:

```bash
NEXT_PUBLIC_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon/publishable key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# SUPABASE_SERVICE_ROLE_KEY is NOT used by the app — leave it unset.
```

Restart the dev server: `pnpm dev`.

## 4. See the seeded data as yourself

Google sign-in creates a fresh `public.users` row via the `handle_new_user`
trigger, defaulting to role `intern` with no data — so your first login shows
empty dashboards. To explore the seeded organization, promote yourself to admin
**once**, in the SQL Editor (replace with your Google email):

```sql
update public.users set role = 'admin' where email = 'you@callourstudio.com';
```

Admins see the whole program (RLS grants full read), so every seeded chart and
roster populates immediately. To instead experience the **intern** flow against
seeded history, adopt a seeded persona by linking its row to your auth user:

```sql
-- Make the seeded intern "Maya" you, then remove the empty auto-created row.
update public.users
  set auth_id = (select id from auth.users where email = 'you@callourstudio.com')
  where email = 'maya@callourstudio.com';
delete from public.users
  where email = 'you@callourstudio.com' and auth_id is not null
  and id <> (select id from public.users where email = 'maya@callourstudio.com');
```

## 5. (Optional) Regenerate DB types

`types/database.ts` is hand-authored to match the schema. If you prefer
generated types:

```bash
supabase gen types typescript --project-id <PROJECT_REF> > types/database.ts
```

---

## Rollback

Set `NEXT_PUBLIC_DATA_SOURCE=mock` (or unset it) and restart — you're back on the
seeded in-memory data with the dev persona switcher. No code changes.

## What each piece does

| Piece                              | Role                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| `supabase/client.ts`               | Browser client (OAuth sign-in).                             |
| `supabase/server.ts`               | Cookie-bound server client (RSC, Server Actions).           |
| `supabase/middleware.ts`           | Session refresh + route gating (used by `proxy.ts`).        |
| `services/supabase-data-source.ts` | Maps the DataSource contract to Supabase queries.           |
| `lib/session.ts`                   | `getCurrentUser()` — resolves the signed-in user each mode. |
| RLS (in `schema.sql`)              | Admin = all · Mentor = assigned interns · Intern = own.     |
