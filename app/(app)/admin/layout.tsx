import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

/**
 * Admin-only section. The (app) layout already authenticates; this narrows to
 * admins. Non-admins get a 404 rather than a redirect — the section simply
 * doesn't exist for them.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  return <>{children}</>;
}
