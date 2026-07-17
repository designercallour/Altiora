"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MOOD_SCALE } from "@/lib/domain";
import { cn } from "@/lib/utils";

/**
 * Per-mood colour: values 1–3 lean red (overwhelmed → neutral), 4–6 lean green
 * (okay → great). Intensity grows toward the extremes — the further from the
 * middle, the more saturated. Uses semantic tokens so it stays on-brand + works
 * in dark mode.
 */
function moodColor(value: number) {
  const base = value >= 4 ? "var(--success)" : "var(--destructive)";
  const dist = Math.min(1, Math.abs(value - 3.5) / 2.5); // 0.2 · 0.6 · 1.0
  const strength = Math.round((0.5 + dist * 0.5) * 100); // 60 · 80 · 100
  // Fill intensity grows toward the extremes: the selected 😭 is the reddest,
  // the selected 😀 the greenest.
  const bg = Math.round(14 + dist * 24); // 19 · 28 · 38
  return {
    border: `color-mix(in oklch, ${base} ${strength}%, var(--border))`,
    bgActive: `color-mix(in oklch, ${base} ${bg}%, transparent)`,
  };
}

/** Emoji mood selector. Left = overwhelmed → right = great; stores the value. */
export function MoodPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  const reduce = useReducedMotion();
  const selected = MOOD_SCALE.find((m) => m.value === value);

  return (
    <div className="space-y-4">
      <div
        role="radiogroup"
        aria-label="How did your week feel?"
        className="grid grid-cols-6 gap-2"
      >
        {MOOD_SCALE.map((m) => {
          const active = value === m.value;
          const c = moodColor(m.value);
          return (
            <Tooltip key={m.value}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={m.label}
                    onClick={() => onChange(m.value)}
                    style={
                      {
                        "--mood": c.border,
                        backgroundColor: active ? c.bgActive : undefined,
                      } as React.CSSProperties
                    }
                    className={cn(
                      "focus-visible:ring-ring/50 group flex aspect-square flex-col items-center justify-center rounded-xl border transition-colors outline-none focus-visible:ring-2",
                      active
                        ? "border-[color:var(--mood)]"
                        : "border-border hover:border-[color:var(--mood)]",
                    )}
                  />
                }
              >
                <motion.span
                  className="text-2xl sm:text-3xl"
                  animate={reduce ? undefined : { scale: active ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                >
                  {m.emoji}
                </motion.span>
              </TooltipTrigger>
              <TooltipContent>{m.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <p
        className="text-muted-foreground text-center text-sm"
        aria-live="polite"
      >
        {selected ? (
          <>
            Feeling{" "}
            <span className="text-foreground font-medium">
              {selected.label.toLowerCase()}
            </span>{" "}
            this week
          </>
        ) : (
          "Tap the emoji that fits your week"
        )}
      </p>
    </div>
  );
}
