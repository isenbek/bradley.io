"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getSoakSummary, type SoakBand, type SoakSummary } from "./api"

function fmtFreq(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`
  return `${hz} Hz`
}

export function TopFrequencies({ soak }: { soak: SoakBand[] }) {
  const bands = soak.map((b) => b.band)
  const [selected, setSelected] = useState<string | null>(null)
  const [summary, setSummary] = useState<SoakSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selected && bands.length > 0) {
      const top = [...soak].sort((a, b) => b.n_hits - a.n_hits)[0]
      setSelected(top.band)
    }
  }, [bands, selected, soak])

  useEffect(() => {
    if (!selected) return
    const ctrl = new AbortController()
    let mounted = true
    setLoading(true)
    getSoakSummary(selected, ctrl.signal)
      .then((s) => {
        if (mounted) setSummary(s)
      })
      .catch(() => {
        if (mounted) setSummary(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
      ctrl.abort()
    }
  }, [selected])

  const max = summary?.top?.[0]?.n ?? 1

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
            Top Frequencies
          </h3>
          {summary && (
            <div className="font-mono text-[10px] mt-1" style={{ color: "var(--brand-muted)" }}>
              {summary.n_hits.toLocaleString()} hits · first {new Date(summary.time_range.first).toLocaleDateString()}
            </div>
          )}
        </div>
        <div
          className="flex gap-0.5 p-0.5 rounded-md self-end sm:self-auto"
          style={{ background: "color-mix(in srgb, var(--brand-border) 50%, transparent)" }}
        >
          {bands.map((b) => (
            <button
              key={b}
              onClick={() => setSelected(b)}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all"
              style={{
                background:
                  selected === b
                    ? "color-mix(in srgb, var(--brand-primary) 20%, transparent)"
                    : "transparent",
                color: selected === b ? "var(--brand-primary)" : "var(--brand-muted)",
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {loading && !summary ? (
        <div className="py-8 text-center font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
          loading…
        </div>
      ) : summary && summary.top.length > 0 ? (
        <div className="space-y-2">
          {summary.top.map((h, i) => {
            const pct = (h.n / max) * 100
            return (
              <div key={`${h.freq_hz}-${i}`}>
                <div className="flex justify-between font-mono text-xs mb-0.5">
                  <span style={{ color: "var(--brand-text)" }}>{fmtFreq(h.freq_hz)}</span>
                  <span style={{ color: "var(--brand-muted)" }}>
                    {h.n.toLocaleString()} hits
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "var(--brand-border)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                    className="h-full rounded-full"
                    style={{ background: "var(--brand-primary)" }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-8 text-center font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
          no data
        </div>
      )}
    </motion.div>
  )
}
