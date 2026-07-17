import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  /** Right-aligned actions (buttons, etc.). */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 sm:shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
