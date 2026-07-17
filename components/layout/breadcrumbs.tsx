"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ALL_NAV } from "@/lib/nav";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  reports: "Weekly Reports",
  insights: "Insights",
  feedback: "Feedback",
  settings: "Settings",
  new: "New Report",
};

function labelFor(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  const navMatch = ALL_NAV.find((n) => n.href === `/${segment}`);
  if (navMatch) return navMatch.label;
  // Title-case fallback; ids get truncated.
  if (segment.length > 12) return `${segment.slice(0, 8)}…`;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, i) => {
          const href = `/${segments.slice(0, i + 1).join("/")}`;
          const isLast = i === segments.length - 1;
          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{labelFor(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {labelFor(segment)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
