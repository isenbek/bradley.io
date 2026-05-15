"use client"

import { motion } from "framer-motion"
import type { MetricRow } from "./api"

interface GaugeProps {
  label: string
  value: number
  target: number
  min: number
  max: number
  decimals?: number
  suffix?: string
  better?: "closer" | "lower" | "higher"
}

function Gauge({ label, value, target, min, max, decimals = 3, suffix = "", better = "closer" }: GaugeProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const targetPct = ((target - min) / (max - min)) * 100

  const delta = Math.abs(value - target)
  const range = max - min
  const grade =
    better === "closer"
      ? delta < range * 0.02
        ? "good"
        : delta < range * 0.08
        ? "ok"
        : "bad"
      : better === "lower"
      ? value < target
        ? "good"
        : value < target * 2
        ? "ok"
        : "bad"
      : value > target
      ? "good"
      : value > target * 0.95
      ? "ok"
      : "bad"

  const gradeColor =
    grade === "good"
      ? "var(--brand-success, #22c55e)"
      : grade === "ok"
      ? "var(--brand-warning, #f59e0b)"
      : "var(--brand-error)"

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--brand-bg)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs uppercase tracking-wide font-mono" style={{ color: "var(--brand-muted)" }}>
          {label}
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
          target {target}
          {suffix}
        </span>
      </div>
      <div className="font-mono text-2xl font-bold mb-2" style={{ color: gradeColor }}>
        {value.toFixed(decimals)}
        {suffix && <span className="text-sm ml-1 opacity-70">{suffix}</span>}
      </div>
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: "var(--brand-border)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0"
          style={{ background: gradeColor }}
        />
        <div
          className="absolute inset-y-0 w-px"
          style={{
            left: `${targetPct}%`,
            background: "var(--brand-text)",
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  )
}

export function QualityGauges({ metric }: { metric: MetricRow | null }) {
  if (!metric) {
    return (
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl p-5"
        style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "var(--brand-bg)" }} />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
          Statistical Quality
        </h3>
        <span className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
          window · {metric.window_bytes.toLocaleString()} bytes
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Gauge label="Entropy bpb" value={metric.ent_bpb} target={8.0} min={7.0} max={8.0} decimals={3} better="higher" />
        <Gauge label="Bias" value={Math.abs(metric.bias)} target={0} min={0} max={0.05} decimals={4} better="lower" />
        <Gauge label="Ones %" value={metric.ones_pct} target={50} min={48} max={52} decimals={2} suffix="%" />
        <Gauge label="Pileup" value={metric.pileup_pct} target={0} min={0} max={10} decimals={2} suffix="%" better="lower" />
      </div>
    </motion.div>
  )
}
