import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, NotebookPen, Settings } from "lucide-react";
import { ROUTES } from "./constants";
import type { UserRole } from "@/types/domain";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** "soon" renders a Coming Soon affordance and softens the item. */
  badge?: "soon";
  /** Short description, used by the command palette. */
  description?: string;
  /** Roles that see this item. Omitted = visible to everyone. */
  roles?: UserRole[];
}

/** Filter nav items to those visible for a role. */
export function navFor(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((i) => !i.roles || i.roles.includes(role));
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
    roles: ["intern"],
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
