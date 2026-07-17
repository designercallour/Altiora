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

  // Dev-only persona switcher data (mock mode). Empty in supabase mode.
  const personas =
    resolveDataSourceMode() === "mock" ? await getDataSource().listUsers() : [];

  return (
    <AppShell user={user} personas={personas}>
      {children}
    </AppShell>
  );
}
