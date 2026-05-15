"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { BatteryRow } from "./api"

function verdict(r: BatteryRow): "pass" | "warn" | "fail" {
  if (r.total_failures > 0) return "fail"
  if (r.practrand_anomalies > 1) return "warn"
  return "pass"
}

const COLORS = {
  pass: "var(--brand-success, #22c55e)",
  warn: "var(--brand-warning, #f59e0b)",
  fail: "var(--brand-error)",
}

export function BatteryStrip({ rows }: { rows: BatteryRow[] }) {
  const [hover, setHover] = useState<BatteryRow | null>(null)
  const sorted = [...rows].sort((a, b) => a.ts_iso.localeCompare(b.ts_iso))

  const passes = rows.filter((r) => verdict(r) === "pass").length
  const warns = rows.filter((r) => verdict(r) === "warn").length
  const fails = rows.filter((r) => verdict(r) === "fail").length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
          Daily Battery · ent + PractRand + TestU01
        </h3>
        <div className="font-mono text-[10px] flex gap-3" style={{ color: "var(--brand-muted)" }}>
          <span style={{ color: COLORS.pass }}>● {passes} pass</span>
          {warns > 0 && <span style={{ color: COLORS.warn }}>● {warns} warn</span>}
          {fails > 0 && <span style={{ color: COLORS.fail }}>● {fails} fail</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {sorted.map((r) => {
          const v = verdict(r)
          return (
            <button
              key={r.ts_iso}
              onMouseEnter={() => setHover(r)}
              onMouseLeave={() => setHover(null)}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-md transition-transform hover:scale-110"
              style={{
                background: COLORS[v],
                opacity: hover && hover.ts_iso !== r.ts_iso ? 0.5 : 1,
              }}
              aria-label={`${r.ts_iso} ${v}`}
            />
          )
        })}
      </div>

      <div
        className="mt-4 rounded-lg px-4 py-3 font-mono text-xs min-h-[78px]"
        style={{ background: "var(--brand-bg)", border: "1px solid var(--brand-border)" }}
      >
        {hover ? (
          <>
            <div className="font-bold mb-1" style={{ color: "var(--brand-text)" }}>
              {new Date(hover.ts_iso).toLocaleDateString()} · {new Date(hover.ts_iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--brand-muted)" }}>
              <span>ent · <strong style={{ color: "var(--brand-text)" }}>{hover.ent_bpb}</strong></span>
              <span>χ² · <strong style={{ color: "var(--brand-text)" }}>{hover.ent_chi_pct}%</strong></span>
              <span>PractRand · <strong style={{ color: "var(--brand-text)" }}>{hover.practrand_anomalies} anom</strong></span>
              <span>runtime · <strong style={{ color: "var(--brand-text)" }}>{hover.runtime_s}s</strong></span>
              <span>Rabbit · <strong style={{ color: "var(--brand-text)" }}>{hover.rabbit_pass}/{hover.rabbit_n_stats}</strong></span>
              <span>Alphabit · <strong style={{ color: "var(--brand-text)" }}>{hover.alphabit_pass}/{hover.alphabit_n_stats}</strong></span>
              <span>failures · <strong style={{ color: "var(--brand-text)" }}>{hover.total_failures}</strong></span>
              <span>bits · <strong style={{ color: "var(--brand-text)" }}>{hover.n_bits.toLocaleString()}</strong></span>
            </div>
          </>
        ) : (
          <div style={{ color: "var(--brand-muted)" }}>
            Hover a cell for results. Daily run: ent, PractRand, TestU01 Rabbit + Alphabit on {sorted[0]?.n_bits.toLocaleString() || "—"} bits.
          </div>
        )}
      </div>
    </motion.div>
  )
}
