"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CompetencyAxis } from "./types";

interface CompetencyRadarProps {
  data: CompetencyAxis[];
}

export function CompetencyRadar({ data }: CompetencyRadarProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Competency Profile
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 12, fill: "currentColor" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "currentColor" }}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#0f4c75"
            fill="#0f4c75"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const item = payload[0].payload as CompetencyAxis;
              return (
                <div className="bg-popover text-popover-foreground border rounded-md shadow-md px-3 py-2 text-xs">
                  <div className="font-bold">{item.axis}</div>
                  <div className="font-mono">{item.score}/100</div>
                  <div className="text-muted-foreground">{item.detail}</div>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
