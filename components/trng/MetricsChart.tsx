"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts"
import type { MetricRow } from "./api"

type SeriesKey = "ent_bpb" | "bias" | "mean_dt_ms" | "ones_pct"

const SERIES: Record<SeriesKey, { label: string; ref?: number; decimals: number; unit?: string }> = {
  ent_bpb: { label: "Entropy (bits/byte)", ref: 8.0, decimals: 4 },
  bias: { label: "Bias", ref: 0, decimals: 4 },
  mean_dt_ms: { label: "Mean Δt", decimals: 2, unit: "ms" },
  ones_pct: { label: "Ones %", ref: 50, decimals: 3, unit: "%" },
}

export function MetricsChart({ data }: { data: MetricRow[] }) {
  const [series, setSeries] = useState<SeriesKey>("ent_bpb")

  const chartData = useMemo(
    () =>
      data.map((r) => ({
        t: new Date(r.ts_iso).getTime(),
        label: new Date(r.ts_iso).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: r[series],
      })),
    [data, series]
  )

  const spec = SERIES[series]
  const values = chartData.map((d) => d.value)
  const min = Math.min(...values, spec.ref ?? Infinity)
  const max = Math.max(...values, spec.ref ?? -Infinity)
  const pad = (max - min) * 0.15 || 0.01
  const domain: [number, number] = [min - pad, max + pad]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
            24h Trend · {spec.label}
          </h3>
          <div className="font-mono text-[10px] mt-1" style={{ color: "var(--brand-muted)" }}>
            {data.length} samples
          </div>
        </div>
        <div
          className="flex gap-0.5 p-0.5 rounded-md self-end sm:self-auto"
          style={{ background: "color-mix(in srgb, var(--brand-border) 50%, transparent)" }}
        >
          {(Object.keys(SERIES) as SeriesKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSeries(k)}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all"
              style={{
                background:
                  series === k
                    ? "color-mix(in srgb, var(--brand-primary) 20%, transparent)"
                    : "transparent",
                color: series === k ? "var(--brand-primary)" : "var(--brand-muted)",
              }}
            >
              {SERIES[k].label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="var(--brand-border)" strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--brand-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--brand-border)" }}
              minTickGap={32}
            />
            <YAxis
              domain={domain}
              tick={{ fill: "var(--brand-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--brand-border)" }}
              tickFormatter={(v: number) => v.toFixed(spec.decimals).replace(/0+$/, "").replace(/\.$/, "")}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: "var(--brand-bg-alt)",
                border: "1px solid var(--brand-border)",
                borderRadius: "8px",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--brand-muted)" }}
              formatter={(v) => [
                `${typeof v === "number" ? v.toFixed(spec.decimals) : v}${spec.unit ?? ""}`,
                spec.label,
              ]}
            />
            {spec.ref != null && (
              <ReferenceLine
                y={spec.ref}
                stroke="var(--brand-muted)"
                strokeDasharray="4 4"
                label={{
                  value: `target ${spec.ref}`,
                  fill: "var(--brand-muted)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  position: "right",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--brand-primary)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
