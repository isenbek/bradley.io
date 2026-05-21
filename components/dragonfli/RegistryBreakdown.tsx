"use client"

import { motion } from "framer-motion"
import type { RegistryStats } from "./api"

function cleanKey(s: string): string {
  return s.trim().replace(/\s+/g, " ")
}

export function RegistryBreakdown({ stats }: { stats: RegistryStats | null }) {
  if (!stats) {
    return (
      <div
        className="rounded-2xl p-5 sm:p-7 h-48 animate-pulse"
        style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
      />
    )
  }

  const total = stats.total_aircraft || 1
  const types = Object.entries(stats.aircraft_by_type)
    .map(([k, v]) => ({ label: cleanKey(k), value: v, pct: (v / total) * 100 }))
    .sort((a, b) => b.value - a.value)
  const mfrs = Object.entries(stats.top_manufacturers)
    .map(([k, v]) => ({ label: cleanKey(k), value: v }))
    .sort((a, b) => b.value - a.value)
  const mfrMax = mfrs[0]?.value || 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
          FAA Registry · {stats.total_aircraft.toLocaleString()} aircraft
        </h3>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: "var(--brand-muted)" }}>
            by type
          </div>
          <div
            className="flex h-3 rounded-full overflow-hidden mb-3"
            style={{ background: "var(--brand-border)" }}
          >
            {types.map((t, i) => {
              const palette = [
                "var(--brand-primary)",
                "var(--brand-secondary)",
                "color-mix(in srgb, var(--brand-primary) 70%, var(--brand-bg-alt))",
                "color-mix(in srgb, var(--brand-secondary) 60%, var(--brand-bg-alt))",
                "color-mix(in srgb, var(--brand-primary) 40%, var(--brand-bg-alt))",
                "color-mix(in srgb, var(--brand-muted) 80%, transparent)",
                "color-mix(in srgb, var(--brand-muted) 60%, transparent)",
                "color-mix(in srgb, var(--brand-muted) 40%, transparent)",
                "color-mix(in srgb, var(--brand-muted) 20%, transparent)",
              ]
              return (
                <motion.div
                  key={t.label}
                  initial={{ width: 0 }}
                  animate={{ width: `${t.pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.05 }}
                  style={{ background: palette[i % palette.length] }}
                  title={`${t.label} · ${t.pct.toFixed(1)}%`}
                />
              )
            })}
          </div>
          <div className="space-y-1 text-xs">
            {types.map((t) => (
              <div key={t.label} className="flex justify-between items-baseline">
                <span style={{ color: "var(--brand-text)" }}>{t.label}</span>
                <span className="font-mono" style={{ color: "var(--brand-muted)" }}>
                  {t.value.toLocaleString()}
                  <span className="opacity-60 ml-1">{t.pct.toFixed(1)}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: "var(--brand-muted)" }}>
            top manufacturers
          </div>
          <div className="space-y-1.5">
            {mfrs.map((m, i) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span style={{ color: "var(--brand-text)" }}>{m.label}</span>
                  <span className="font-mono" style={{ color: "var(--brand-muted)" }}>
                    {m.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--brand-border)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.value / mfrMax) * 100}%` }}
                    transition={{ duration: 0.7, delay: i * 0.04 }}
                    className="h-full rounded-full"
                    style={{ background: "var(--brand-primary)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
