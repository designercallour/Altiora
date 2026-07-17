import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  NotebookPen,
  Sparkles,
  MessagesSquare,
  Settings,
} from "lucide-react";
import { ROUTES } from "./constants";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** "soon" renders a Coming Soon affordance and softens the item. */
  badge?: "soon";
  /** Short description, used by the command palette. */
  description?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    description: "Your week at a glance",
  },
  {
    label: "Weekly Reports",
    href: ROUTES.reports,
    icon: NotebookPen,
    description: "Reflect on your week",
  },
  {
    label: "Insights",
    href: ROUTES.insights,
    icon: Sparkles,
    badge: "soon",
    description: "Organizational intelligence",
  },
  {
    label: "Feedback",
    href: ROUTES.feedback,
    icon: MessagesSquare,
    badge: "soon",
    description: "Mentor feedback & growth",
  },
];

export const SECONDARY_NAV: NavItem[] = [
  {
    label: "Settings",
    href: ROUTES.settings,
    icon: Settings,
    description: "Profile & preferences",
  },
];

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];
