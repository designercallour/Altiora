import "server-only";
import { cookies } from "next/headers";
import { getDataSource, resolveDataSourceMode } from "@/services";
import type { AppUser, UserRole } from "@/types/domain";

/** Mock session cookie: holds the impersonated public.users id. */
export const SESSION_COOKIE = "altiora_session";

/**
 * The single source of truth for "who is signed in", server-side.
 *
 * - mock mode     → the session cookie names a seeded user.
 * - supabase mode → Supabase Auth resolves the user, mapped via the DataSource.
 *
 * Returns null when signed out; callers (layout + middleware) redirect to login.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (resolveDataSourceMode() === "supabase") {
    // SupabaseDataSource resolves the current auth user → public.users row.
    return getDataSource().getCurrentUser();
  }

  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return getDataSource().getUserById(id);
}

/** Convenience guard for role-gated server logic. */
export function hasRole(user: AppUser | null, ...roles: UserRole[]): boolean {
  return !!user && roles.includes(user.role);
}
