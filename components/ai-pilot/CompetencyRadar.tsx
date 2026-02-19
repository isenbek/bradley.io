"use client";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import type { CompetencyAxis } from "./types";

interface CompetencyRadarProps {
  data: CompetencyAxis[];
}

export function CompetencyRadar({ data }: CompetencyRadarProps) {
  return (
    <div className="w-full">
      <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4" style={{ color: "var(--brand-muted)" }}>
        Competency Profile
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--brand-border)" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "currentColor" }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "currentColor" }} axisLine={false} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--brand-primary)"
            fill="var(--brand-primary)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const item = payload[0].payload as CompetencyAxis;
              return (
                <div
                  className="rounded-md shadow-md px-3 py-2 text-xs"
                  style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
                >
                  <div className="font-bold">{item.axis}</div>
                  <div className="font-mono">{item.score}/100</div>
                  <div style={{ color: "var(--brand-muted)" }}>{item.detail}</div>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
