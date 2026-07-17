import * as React from "react";
import { cn } from "@/lib/utils";

export interface BarListItem {
  label: string;
  value: number;
  /** Optional right-aligned formatted value; defaults to the number. */
  display?: string;
}

/**
 * A lightweight ranked bar list (no charting library) — for distributions like
 * learnings-by-category or top skills. Calm, on-brand, and cheap to render.
 */
export function BarList({
  items,
  className,
  emptyLabel = "No data yet",
}: {
  items: BarListItem[];
  className?: string;
  emptyLabel?: string;
}) {
  if (!items.length) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        {emptyLabel}
      </p>
    );
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{item.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {item.display ?? item.value}
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary/80 h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
