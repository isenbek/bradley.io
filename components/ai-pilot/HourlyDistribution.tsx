"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { HourlyDistribution as HourlyDistributionType } from "./types";

interface HourlyDistributionProps {
  data: HourlyDistributionType;
}

export function HourlyDistribution({ data }: HourlyDistributionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Hourly Activity Distribution
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          Peak: {data.peakHour.toString().padStart(2, "0")}:00 (
          {data.peakCount.toLocaleString()} sessions)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data.hours}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "currentColor" }}
            interval={2}
          />
          <YAxis tick={{ fontSize: 10, fill: "currentColor" }} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-popover text-popover-foreground border rounded-md shadow-md px-3 py-2 text-xs">
                  <div className="font-mono font-bold">{item.label}</div>
                  <div>{item.count.toLocaleString()} sessions</div>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.hours.map((entry) => (
              <Cell
                key={entry.hour}
                fill={
                  entry.hour === data.peakHour
                    ? "#e0474c"
                    : "#0f4c75"
                }
                opacity={entry.hour === data.peakHour ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
