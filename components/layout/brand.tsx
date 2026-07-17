import * as React from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** The Altiora mark — an upward chevron (altiora = "higher things"). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-4"
        strokeWidth={2.4}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 15l7-8 7 8" />
        <path d="M8.5 15l3.5-4 3.5 4" opacity={0.5} />
      </svg>
    </span>
  );
}

export function Brand({
  className,
  href = ROUTES.dashboard,
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2",
        className,
      )}
    >
      <BrandMark />
      <span className="font-heading text-[0.95rem] font-semibold tracking-tight">
        Altiora
      </span>
    </Link>
  );
}
