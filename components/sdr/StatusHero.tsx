"use client"

import { motion } from "framer-motion"
import { Radio, Activity } from "lucide-react"
import type { HealthResponse, SoakBand } from "./api"

interface Props {
  health: HealthResponse | null
  soak: SoakBand[]
  error: boolean
}

export function StatusHero({ health, soak, error }: Props) {
  const ok = !!health && health.status === "ok" && !error
  const status = error ? "OFFLINE" : ok ? "SCANNING" : "DEGRADED"
  const color = error
    ? "var(--brand-error)"
    : ok
    ? "var(--brand-success, #22c55e)"
    : "var(--brand-warning, #f59e0b)"

  const totalHits = soak.reduce((s, b) => s + b.n_hits, 0)
  const allDates = new Set<string>()
  soak.forEach((b) => b.dates.forEach((d) => allDates.add(d)))

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
            <Radio size={12} />
            sdr-api · bali.lan · tinymachines.ai
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight" style={{ color: "var(--brand-text)" }}>
            {totalHits.toLocaleString()} hits
            <span className="block text-xl sm:text-2xl mt-1 font-normal" style={{ color: "var(--brand-muted)" }}>
              across {soak.length} bands · {allDates.size} scan days
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: color, opacity: ok ? 0.5 : 0.2 }}
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
              v{health?.version ?? "—"} · db {health?.db ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-mono" style={{ color: "var(--brand-muted)" }}>
        <span className="inline-flex items-center gap-1.5">
          <Activity size={12} />
          rtl-sdr · bash + C scanners · systemd templated units
        </span>
        <span>airband · cellular · LoRa · NOAA wx · zigbee</span>
      </div>
    </motion.div>
  )
}
