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

const AXIS = "var(--muted-foreground)";

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
}: {
  data: SeriesPoint[];
  color?: string;
  height?: number;
  yDomain?: [number, number];
  valueSuffix?: string;
  ariaLabel?: string;
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
            tick={{ fontSize: 11, fill: AXIS }}
            width={34}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ stroke: "var(--border)" }}
            formatter={(v) => [`${v}${valueSuffix}`, ""] as [string, string]}
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
