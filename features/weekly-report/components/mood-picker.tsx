"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOOD_SCALE } from "@/lib/domain";
import { cn } from "@/lib/utils";

/** Emoji mood selector. Renders best → worst; stores the ordinal value. */
export function MoodPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  const reduce = useReducedMotion();
  const ordered = [...MOOD_SCALE].reverse(); // 😀 great → 😭 overwhelmed
  const selected = MOOD_SCALE.find((m) => m.value === value);

  return (
    <div className="space-y-4">
      <div
        role="radiogroup"
        aria-label="How did your week feel?"
        className="grid grid-cols-6 gap-2"
      >
        {ordered.map((m) => {
          const active = value === m.value;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={m.label}
              onClick={() => onChange(m.value)}
              className={cn(
                "focus-visible:ring-ring/50 group flex aspect-square flex-col items-center justify-center rounded-xl border transition-colors outline-none focus-visible:ring-2",
                active
                  ? "border-primary bg-primary/8"
                  : "border-border hover:border-primary/40 hover:bg-accent/50",
              )}
            >
              <motion.span
                className="text-2xl sm:text-3xl"
                animate={reduce ? undefined : { scale: active ? 1.12 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                {m.emoji}
              </motion.span>
            </button>
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
