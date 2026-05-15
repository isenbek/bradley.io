"use client"

import { motion } from "framer-motion"
import { Activity, Zap } from "lucide-react"
import type { HealthResponse, StatsResponse } from "./api"

interface Props {
  health: HealthResponse | null
  stats: StatsResponse | null
  error: boolean
}

export function StatusHero({ health, stats, error }: Props) {
  const healthy = !!health?.healthy && !error
  const status = error ? "OFFLINE" : healthy ? "HEALTHY" : "DEGRADED"
  const color = error
    ? "var(--brand-error)"
    : healthy
    ? "var(--brand-success, #22c55e)"
    : "var(--brand-warning, #f59e0b)"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-6 sm:p-10"
      style={{
        background: "var(--brand-bg-alt)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "var(--brand-muted)" }}>
            <Zap size={12} />
            Hotbits TRNG · tinymachines.ai
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight" style={{ color: "var(--brand-text)" }}>
            True randomness
            <span className="block text-xl sm:text-2xl mt-1 font-normal" style={{ color: "var(--brand-muted)" }}>
              harvested from radioactive decay
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: color, opacity: healthy ? 0.5 : 0.2 }}
            />
            <span
              className="relative block w-4 h-4 rounded-full"
              style={{ background: color }}
            />
          </div>
          <div>
            <div className="font-mono text-lg sm:text-xl font-bold tracking-wide" style={{ color }}>
              {status}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
              {stats ? `pool · ${health?.pool_fresh_bytes ?? 0} / ${stats.low_water_bytes} bytes` : "pool · —"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-mono" style={{ color: "var(--brand-muted)" }}>
        <span className="inline-flex items-center gap-1.5">
          <Activity size={12} />
          {health?.events_csv_fresh ? "events fresh" : "events stale"}
        </span>
        <span>logger {health?.logger_service_active ? "active" : "down"}</span>
        <span>last event {health?.events_csv_age_s != null ? `${health.events_csv_age_s.toFixed(1)}s ago` : "—"}</span>
      </div>
    </motion.div>
  )
}
