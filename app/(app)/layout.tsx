import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDataSource, resolveDataSourceMode } from "@/services";
import { AppShell } from "@/components/layout/app-shell";
import { ROUTES } from "@/lib/constants";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  // Note: interns whose internship isn't active are NOT locked out of the app —
  // they keep read-only access to their Weekly Reflections, Monthly 1-on-1s, and
  // Offboarding. Only the Dashboard sends them to the celebration/alumni home
  // (see the intern dashboard); active-only actions (submitting a reflection)
  // stay blocked in their own server actions.

  // Dev-only persona switcher data (mock mode). Empty in supabase mode.
  const personas =
    resolveDataSourceMode() === "mock" ? await getDataSource().listUsers() : [];

  return (
    <AppShell user={user} personas={personas}>
      {children}
    </AppShell>
  );
}
