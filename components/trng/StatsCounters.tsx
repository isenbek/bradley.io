"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion } from "framer-motion"
import type { StatsResponse, ContinuousHealth, MetricRow } from "./api"

function Counter({
  value,
  label,
  suffix = "",
  decimals = 0,
}: {
  value: number
  label: string
  suffix?: string
  decimals?: number
}) {
  const fmt = useCallback(
    (v: number) =>
      decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
    [decimals]
  )
  const [display, setDisplay] = useState(() => fmt(value))
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) {
      setDisplay(fmt(value))
      return
    }
    const from = prev.current
    const to = value
    prev.current = value
    const duration = 900
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(fmt(from + (to - from) * eased))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, fmt])

  return (
    <div className="text-center">
      <div className="font-mono text-xl sm:text-3xl font-bold" style={{ color: "var(--brand-primary)" }}>
        {display}
        {suffix && <span className="text-sm ml-1 opacity-70">{suffix}</span>}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wide mt-1" style={{ color: "var(--brand-muted)" }}>
        {label}
      </div>
    </div>
  )
}

interface Props {
  stats: StatsResponse | null
  cont: ContinuousHealth | null
  metric: MetricRow | null
}

export function StatsCounters({ stats, cont, metric }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <Counter value={stats?.last_extract_event_count ?? 0} label="Decay Events" />
      <Counter value={cont?.total_bits_processed ?? 0} label="Bits Processed" />
      <Counter value={metric?.mean_dt_ms ?? 0} label="Mean Δt" suffix="ms" decimals={1} />
      <Counter value={stats?.consumed_bytes ?? 0} label="Bytes Served" />
    </motion.div>
  )
}
