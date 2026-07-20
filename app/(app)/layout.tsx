import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDataSource, resolveDataSourceMode } from "@/services";
import { AppShell } from "@/components/layout/app-shell";
import { isInternshipActive } from "@/lib/internship";
import { ROUTES } from "@/lib/constants";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  // Access control: an intern may use the app only while their internship is
  // active (today ∈ [start, end]). Enforced here server-side — never trust the
  // client. Admins and mentors are not internship-gated.
  if (user.role === "intern") {
    const internship = await getDataSource().getActiveInternshipForUser(user.id);
    if (!isInternshipActive(internship)) {
      redirect(ROUTES.internshipComplete);
    }
  }

  // Dev-only persona switcher data (mock mode). Empty in supabase mode.
  const personas =
    resolveDataSourceMode() === "mock" ? await getDataSource().listUsers() : [];

  return (
    <AppShell user={user} personas={personas}>
      {children}
    </AppShell>
  );
}
