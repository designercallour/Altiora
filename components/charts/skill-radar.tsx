"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export interface SkillDatum {
  skill: string;
  value: number;
}

export function SkillRadar({
  data,
  height = 260,
  color = "var(--chart-1)",
}: {
  data: SkillDatum[];
  height?: number;
  color?: string;
}) {
  const label = data.length
    ? `Skill self-assessment radar across ${data.length} skills`
    : "Skill radar, no data yet";
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.18}
            strokeWidth={2}
            dot={{ r: 2, fill: color, strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
