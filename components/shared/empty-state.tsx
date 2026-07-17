import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** "bordered" (dashed container) or "plain" (no container). */
  variant?: "bordered" | "plain";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "bordered",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        variant === "bordered" &&
          "border-border rounded-xl border border-dashed",
        className,
      )}
    >
      {Icon ? (
        <span className="bg-muted text-muted-foreground mb-4 flex size-11 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <h3 className="text-sm font-medium">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-pretty">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
