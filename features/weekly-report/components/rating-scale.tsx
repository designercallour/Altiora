"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RatingScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  count?: number;
  ariaLabel: string;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
}

/** Compact 1..N segmented rating (default 1–5). Keyboard + screen-reader ready. */
export function RatingScale({
  value,
  onChange,
  count = 5,
  ariaLabel,
  minLabel,
  maxLabel,
  className,
}: RatingScaleProps) {
  const values = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {values.map((v) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${v}`}
              onClick={() => onChange(v)}
              className={cn(
                "focus-visible:ring-ring/50 h-9 rounded-lg border text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-2",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
      {minLabel || maxLabel ? (
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
