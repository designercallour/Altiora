import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";

const SESSION_COOKIE = "altiora_session";

/**
 * Route protection (Next 16 "proxy" convention, formerly middleware).
 *
 * - supabase mode → delegate to Supabase session refresh + gating.
 * - mock mode     → gate on the presence of the mock session cookie.
 *
 * Either way: unauthenticated users are sent to /auth/login, and
 * authenticated users are kept out of /auth/*.
 */
export async function proxy(request: NextRequest) {
  const mode =
    process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";

  if (mode === "supabase") {
    return updateSession(request);
  }

  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isAuthRoute = pathname.startsWith("/auth");

  if (!hasSession && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }
  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
