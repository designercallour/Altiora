import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session and gates routes.
 * Only invoked when NEXT_PUBLIC_DATA_SOURCE=supabase (see proxy.ts).
 *
 * Access is allowlisted: a Google account can only use the app if it has an
 * approved `public.users` row (created by the handle_new_user trigger, which
 * only provisions emails on `public.allowed_emails`). Anyone who authenticates
 * with Google but isn't on the list is bounced to login as "unauthorized".
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Approved = signed in AND on the allowlist (has an active public.users row).
  let approved = false;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    approved = !!data;
  }

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/auth");

  // Signed in with Google but not on the allowlist → block all app access.
  if (user && !approved && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "?error=unauthorized";
    return NextResponse.redirect(url);
  }

  // Not signed in → login.
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Approved and already signed in → keep out of the auth pages.
  if (user && approved && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
