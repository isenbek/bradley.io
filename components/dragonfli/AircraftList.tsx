"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Aircraft } from "./api"

function cleanName(s: string | null | undefined): string {
  return (s ?? "").trim().replace(/\s+/g, " ")
}

function altBar(alt: number | null): number {
  if (alt == null) return 0
  return Math.max(0, Math.min(100, (alt / 45000) * 100))
}

function VerticalIcon({ rate }: { rate: number | null }) {
  if (rate == null || Math.abs(rate) < 100) {
    return <Minus size={12} style={{ color: "var(--brand-muted)" }} />
  }
  if (rate > 0) return <TrendingUp size={12} style={{ color: "var(--brand-success, #22c55e)" }} />
  return <TrendingDown size={12} style={{ color: "var(--brand-warning, #f59e0b)" }} />
}

export function AircraftList({ aircraft }: { aircraft: Aircraft[] }) {
  const sorted = [...aircraft].sort((a, b) => (b.alt_baro ?? 0) - (a.alt_baro ?? 0))

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
          Live Skies · {aircraft.length} aircraft
        </h3>
        <span className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
          sorted by altitude
        </span>
      </div>

      {aircraft.length === 0 ? (
        <div className="py-8 text-center font-mono text-sm" style={{ color: "var(--brand-muted)" }}>
          no aircraft in view
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
          {sorted.map((a) => {
            const e = a.enrich
            const ownerModel = [cleanName(e?.owner), cleanName(e?.model)].filter(Boolean).join(" · ")
            return (
              <div
                key={a.icao}
                className="py-3 grid grid-cols-12 gap-3 items-center"
                style={{ borderColor: "var(--brand-border)" }}
              >
                <div className="col-span-12 sm:col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                      {a.callsign?.trim() || a.icao.toUpperCase()}
                    </span>
                    {e?.n_number && (
                      <span className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
                        N{e.n_number}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: "var(--brand-muted)" }}>
                    {ownerModel || cleanName(e?.manufacturer) || a.source}
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <VerticalIcon rate={a.vertical_rate} />
                    <span style={{ color: "var(--brand-text)" }}>
                      {a.alt_baro != null ? `${a.alt_baro.toLocaleString()}ft` : "—"}
                    </span>
                  </div>
                  <div className="h-1 mt-1 rounded-full" style={{ background: "var(--brand-border)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${altBar(a.alt_baro)}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: "var(--brand-primary)" }}
                    />
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-2 font-mono text-xs text-right" style={{ color: "var(--brand-text)" }}>
                  {a.speed != null ? `${Math.round(a.speed)}kt` : "—"}
                </div>
                <div className="col-span-3 sm:col-span-2 font-mono text-[10px] text-right" style={{ color: "var(--brand-muted)" }}>
                  {a.rssi_db != null ? `${a.rssi_db.toFixed(1)} dB` : "—"}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
