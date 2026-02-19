"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import type { HourlyDistribution as HourlyDistributionType } from "./types";

interface HourlyDistributionProps {
  data: HourlyDistributionType;
}

export function HourlyDistribution({ data }: HourlyDistributionProps) {
  return (
    <div
      className="rounded-xl p-3 sm:p-5"
      style={{
        background: "var(--brand-bg-alt)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-medium" style={{ color: "var(--brand-muted)" }}>
          Hourly Activity Distribution
        </h3>
        <span className="text-[10px] sm:text-xs font-mono" style={{ color: "var(--brand-muted)" }}>
          Peak: {data.peakHour.toString().padStart(2, "0")}:00 ({data.peakCount.toLocaleString()} sessions)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data.hours}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "currentColor" }} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: "currentColor" }} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const item = payload[0].payload;
              return (
                <div
                  className="rounded-md shadow-md px-3 py-2 text-xs"
                  style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
                >
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
                fill={entry.hour === data.peakHour ? "var(--brand-warning)" : "var(--brand-primary)"}
                opacity={entry.hour === data.peakHour ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
