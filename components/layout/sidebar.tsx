"use client";

import * as React from "react";
import { Brand } from "./brand";
import { SearchTrigger } from "./search-trigger";
import { NavList } from "./nav-list";
import { UserMenu } from "./user-menu";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/nav";
import type { AppUser } from "@/types/domain";
import { cn } from "@/lib/utils";

export function Sidebar({
  user,
  personas,
  className,
  onNavigate,
}: {
  user: AppUser;
  personas: AppUser[];
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex w-64 flex-col border-r",
        className,
      )}
    >
      <div className="flex h-14 items-center px-4">
        <Brand />
      </div>

      <div className="px-3 pb-3">
        <SearchTrigger />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <NavList items={PRIMARY_NAV} onNavigate={onNavigate} />
      </div>

      <div className="px-3 py-2">
        <NavList items={SECONDARY_NAV} onNavigate={onNavigate} />
      </div>

      <div className="border-t p-2">
        <UserMenu user={user} personas={personas} />
      </div>
    </aside>
  );
}
