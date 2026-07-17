# ADR-0003 — User role as an enum column, not a roles table

**Status:** Accepted

## Context

The product brief was internally inconsistent about roles: it listed both a
"roles" core table _and_ an "enum for User Role". We had to pick one for the MVP.

Two facts drive the decision:

1. **RLS evaluates the user's role on nearly every query.** Every policy gate
   runs through `is_admin()` → `current_app_role()`, which reads the role for
   `auth.uid()`. If role lived in a separate `roles` table, that resolution would
   be an extra join on the hot path of every request.
2. **The role set is tiny and stable** — `admin`, `mentor`, `intern`. It is not a
   dimension the organization curates the way it curates skills or projects; it is
   system state the authorization code depends on (cf. ADR-0002).

A joined roles/permissions model buys granular RBAC, but that is post-MVP scope
and adds latency and query complexity for zero near-term benefit.

## Decision

Model role as a native enum **column** on `users`, not a table:

```sql
create type user_role as enum ('admin', 'mentor', 'intern');
-- ...
role user_role not null default 'intern'
```

There is **no `roles` table**. Authorization reads `users.role` directly via the
`SECURITY DEFINER` helper `current_app_role()`. `users.role` is indexed
(`users_role_idx`, partial on live rows).

## Consequences

- RLS policies resolve role with a single indexed read, no join. Policy
  expressions stay short and fast.
- Adding a role means an `alter type ... add value` migration — acceptable given
  how rarely the set changes.
- No per-permission granularity yet: the three roles are coarse. Accepted for MVP;
  the app enforces finer rules in Server Actions where needed.
- **This is a deliberate, reversible call.** See the migration path below —
  moving to granular RBAC later is additive and does **not** restructure existing
  tables.

### Migration path to granular RBAC (future, not in MVP)

When per-permission control is needed, evolve **without** restructuring:

1. Add `roles` and `role_permissions` (and optionally `user_roles` for many-to-
   many) as **new** tables.
2. **Backfill** `roles` from the existing `user_role` enum values and map each
   `users.role` to the corresponding `roles` row.
3. Switch RLS/authorization helpers to check the join
   (`current_app_role()` becomes a lookup through `user_roles`/`role_permissions`).
4. Keep `users.role` as a **denormalized fast-path cache** for the common
   admin/mentor/intern gate, or drop the column once policies no longer read it.

No existing table is renamed or dropped; the change is purely additive.

## Alternatives considered

- **`roles` table from day one** — rejected; adds a hot-path join and modeling
  overhead for a set of three values that rarely changes, with no MVP payoff.
- **Text column with a `check` constraint** — weaker than an enum (no shared type,
  clumsier to extend) and no real gain over the enum.
- **Full RBAC (roles + permissions + user_roles) now** — correct destination,
  wrong time; deferred behind the additive path above.
