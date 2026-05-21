"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Radio } from "lucide-react"
import type { SoakBand } from "./api"

function bandColor(name: string): string {
  const map: Record<string, string> = {
    airband: "#60a5fa",
    "cell-low": "#f472b6",
    "lora-us": "#34d399",
    "noaa-wx": "#fbbf24",
  }
  return map[name] ?? "var(--brand-primary)"
}

function ageStr(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const h = diff / 3600_000
    if (h < 24) return `${h.toFixed(0)}h ago`
    return `${(h / 24).toFixed(0)}d ago`
  } catch {
    return "—"
  }
}

export function SoakArchive({ soak }: { soak: SoakBand[] }) {
  const sorted = useMemo(
    () => [...soak].sort((a, b) => b.n_hits - a.n_hits),
    [soak]
  )

  const allDates = useMemo(() => {
    const s = new Set<string>()
    soak.forEach((b) => b.dates.forEach((d) => s.add(d)))
    return [...s].sort()
  }, [soak])

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
          Soak Archive · long-running passive captures
        </h3>
        <span className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
          {allDates.length} scan days
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((b) => {
          const color = bandColor(b.band)
          return (
            <div
              key={b.band}
              className="rounded-xl p-4"
              style={{
                background: "var(--brand-bg)",
                border: "1px solid var(--brand-border)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="font-mono text-sm font-bold" style={{ color: "var(--brand-text)" }}>
                    {b.band}
                  </span>
                </div>
                <span className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
                  last · {ageStr(b.last_seen)}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-mono text-2xl font-bold" style={{ color }}>
                  {b.n_hits.toLocaleString()}
                </span>
                <span className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
                  hits over {b.dates.length} days
                </span>
              </div>

              {/* Calendar strip */}
              <div className="flex gap-1">
                {allDates.map((d) => {
                  const present = b.dates.includes(d)
                  return (
                    <div
                      key={d}
                      className="flex-1 h-6 rounded-sm"
                      style={{
                        background: present ? color : "var(--brand-border)",
                        opacity: present ? 1 : 0.4,
                      }}
                      title={`${d} ${present ? "· scanned" : "· no data"}`}
                    />
                  )
                })}
              </div>
              <div className="mt-1 font-mono text-[9px] flex justify-between" style={{ color: "var(--brand-muted)" }}>
                <span>{allDates[0]?.slice(5) ?? ""}</span>
                <span>{allDates[allDates.length - 1]?.slice(5) ?? ""}</span>
              </div>
            </div>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="py-8 text-center font-mono text-sm" style={{ color: "var(--brand-muted)" }}>
          <Radio size={20} className="mx-auto mb-2 opacity-50" />
          no soak data yet
        </div>
      )}
    </motion.div>
  )
}
