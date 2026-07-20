import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — **server-only**, bypasses RLS.
 *
 * Used only by trusted background jobs (e.g. the weekly-reminder cron) that must
 * write rows on behalf of many users with no user session. NEVER import this
 * into anything reachable from the browser, and never expose the key.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for admin/cron operations.",
    );
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
