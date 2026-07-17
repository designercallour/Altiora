import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { InternDashboard } from "@/features/dashboard/intern/intern-dashboard";
import { MentorDashboard } from "@/features/dashboard/mentor/mentor-dashboard";
import { AdminDashboard } from "@/features/dashboard/admin/admin-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // (app) layout + proxy guard against this

  if (user.role === "mentor") return <MentorDashboard user={user} />;
  if (user.role === "admin") return <AdminDashboard user={user} />;
  return <InternDashboard user={user} />;
}
