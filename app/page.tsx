import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

// Auth is mocked this phase — send everyone to the dashboard.
// Phase 3 replaces this with a session-aware redirect (→ login when signed out).
export default function HomePage() {
  redirect(ROUTES.dashboard);
}
