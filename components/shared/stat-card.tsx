import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatTrend {
  value: string;
  direction: "up" | "down" | "flat";
  /** When false, "down" is not treated as negative (e.g. fewer blockers). */
  positiveIsUp?: boolean;
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  trend?: StatTrend;
  className?: string;
}

const trendIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? trendIcon[trend.direction] : null;
  const positiveIsUp = trend?.positiveIsUp ?? true;
  const isPositive =
    trend?.direction === "flat"
      ? null
      : (trend?.direction === "up") === positiveIsUp;

  return (
    <Card size="sm" className={cn("gap-0", className)}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            {label}
          </span>
          {Icon ? (
            <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-lg">
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-3">
          <span
            className="text-2xl leading-none font-semibold tracking-tight tabular-nums"
            data-tabular
          >
            {value}
          </span>
          {trend && TrendIcon ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                isPositive === null && "text-muted-foreground",
                isPositive === true && "text-success",
                isPositive === false && "text-destructive",
              )}
            >
              <TrendIcon className="size-3.5" aria-hidden />
              {trend.value}
            </span>
          ) : null}
        </div>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
