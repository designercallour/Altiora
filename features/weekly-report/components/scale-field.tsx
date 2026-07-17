"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";

/** A 1–N slider with a large numeric readout and endpoint labels. */
export function ScaleField({
  value,
  onChange,
  min = 1,
  max = 10,
  minLabel,
  maxLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-center gap-1.5">
        <span className="text-5xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        <span className="text-muted-foreground text-lg">/ {max}</span>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={1}
        onValueChange={(v) => onChange(Array.isArray(v) ? (v[0] ?? min) : v)}
      />
      {minLabel || maxLabel ? (
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
