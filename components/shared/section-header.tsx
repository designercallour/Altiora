import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-2.5">
        {Icon ? (
          <span className="text-muted-foreground mt-0.5 flex size-6 items-center justify-center">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
        <div className="space-y-0.5">
          <h2 className="text-base leading-none font-medium tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
