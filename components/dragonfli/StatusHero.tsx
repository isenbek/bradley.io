"use client"

import { motion } from "framer-motion"
import { Plane, MapPin, Radio } from "lucide-react"
import type { HealthResponse, ReceiverFix } from "./api"

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

interface Props {
  health: HealthResponse | null
  receiver: ReceiverFix | null
  error: boolean
}

export function StatusHero({ health, receiver, error }: Props) {
  const fresh = !!health && health.last_event_age_s < 5 && !error
  const status = error ? "OFFLINE" : fresh ? "RECEIVING" : "QUIET"
  const color = error
    ? "var(--brand-error)"
    : fresh
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
            <Plane size={12} />
            dragonfli · ADS-B · tinymachines.ai
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight" style={{ color: "var(--brand-text)" }}>
            {health?.n_aircraft_active ?? "—"} aircraft
            <span className="block text-xl sm:text-2xl mt-1 font-normal" style={{ color: "var(--brand-muted)" }}>
              in the sky above {receiver ? `${receiver.lat.toFixed(2)}°, ${receiver.lon.toFixed(2)}°` : "the antenna"}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: color, opacity: fresh ? 0.5 : 0.2 }}
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
              uptime · {health ? formatUptime(health.uptime_s) : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-mono" style={{ color: "var(--brand-muted)" }}>
        <span className="inline-flex items-center gap-1.5">
          <Radio size={12} />
          last event {health ? `${health.last_event_age_s.toFixed(2)}s ago` : "—"}
        </span>
        {receiver && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} />
            antenna · {receiver.alt_msl.toFixed(0)}m MSL · hdop {receiver.hdop.toFixed(1)}
          </span>
        )}
        <span>{health?.parse_errors ?? 0} parse errors · {health?.queue_full_drops ?? 0} drops</span>
      </div>
    </motion.div>
  )
}
