import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Supabase auth callback — handles both flows:
 *   • OAuth / PKCE magic link → `?code=...`      → exchangeCodeForSession
 *   • Email OTP magic link     → `?token_hash&type` → verifyOtp
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { createClient } = await import("@/supabase/server");
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`);
}
