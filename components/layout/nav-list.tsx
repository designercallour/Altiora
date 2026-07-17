"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const { icon: Icon, label, badge } = item;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors outline-none",
        "focus-visible:ring-ring/50 focus-visible:ring-2",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {active ? (
        <span className="bg-primary absolute top-1/2 -left-2 h-4 w-1 -translate-y-1/2 rounded-full" />
      ) : null}
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <span className="truncate">{label}</span>
      {badge === "soon" ? (
        <span className="border-border text-muted-foreground ml-auto rounded-full border px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
          Soon
        </span>
      ) : null}
    </Link>
  );
}

export function NavList({
  items,
  onNavigate,
  className,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex flex-col gap-0.5", className)}>
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
