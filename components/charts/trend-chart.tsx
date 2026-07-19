"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/insights";
import { moodLevel } from "@/lib/domain";

const AXIS = "var(--muted-foreground)";

/** Nearest mood level for a possibly-averaged value (1..6). */
function nearestMood(v: number) {
  return moodLevel(Math.min(6, Math.max(1, Math.round(v))));
}

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  padding: "6px 10px",
  color: "var(--popover-foreground)",
  boxShadow: "var(--shadow-md)",
};

export function TrendChart({
  data,
  color = "var(--chart-1)",
  height = 200,
  yDomain,
  valueSuffix = "",
  ariaLabel,
  mood = false,
}: {
  data: SeriesPoint[];
  color?: string;
  height?: number;
  yDomain?: [number, number];
  valueSuffix?: string;
  ariaLabel?: string;
  /** Mood mode: emoji Y-axis + "😀 Great" tooltips. */
  mood?: boolean;
}) {
  const id = React.useId().replace(/:/g, "");
  const label =
    ariaLabel ??
    (data.length
      ? `Trend across ${data.length} points, from ${data[0]!.value} to ${data[data.length - 1]!.value}${valueSuffix}`
      : "Trend chart, no data yet");

  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
        >
          <defs>
            <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            dy={6}
          />
          <YAxis
            domain={yDomain ?? ["auto", "auto"]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: mood ? 15 : 11, fill: AXIS }}
            width={mood ? 30 : 34}
            allowDecimals={false}
            ticks={mood ? [1, 2, 3, 4, 5, 6] : undefined}
            tickFormatter={
              mood ? (v) => nearestMood(Number(v))?.emoji ?? String(v) : undefined
            }
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ stroke: "var(--border)" }}
            separator=""
            formatter={
              mood
                ? (v) => {
                    const m = nearestMood(Number(v));
                    const label = m ? `${m.emoji} ${m.label}` : String(v);
                    const decimal = Number(v) % 1 !== 0;
                    return [decimal ? `${label} · ${v}` : label, ""] as [
                      string,
                      string,
                    ];
                  }
                : (v) => [`${v}${valueSuffix}`, ""] as [string, string]
            }
            labelStyle={{ color: "var(--muted-foreground)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${id})`}
            dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
