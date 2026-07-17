"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/session";
import { resolveDataSourceMode } from "@/services";
import { ROUTES } from "@/lib/constants";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Sign in as a specific seeded user (mock mode / dev persona switch).
 * In supabase mode this is a no-op guard — real sign-in goes through OAuth.
 */
export async function signInAsPersona(userId: string) {
  if (resolveDataSourceMode() === "supabase") return;
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: THIRTY_DAYS,
  });
  redirect(ROUTES.dashboard);
}

export async function signOut() {
  if (resolveDataSourceMode() === "supabase") {
    const { createClient } = await import("@/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  } else {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  }
  redirect(ROUTES.login);
}
