"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Radio } from "lucide-react"
import { getHealth, getLatestMetric, getStats, type HealthResponse, type MetricRow, type StatsResponse } from "@/components/trng/api"

export function TRNGCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [metric, setMetric] = useState<MetricRow | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const load = async () => {
      try {
        const [h, s, m] = await Promise.all([
          getHealth(ctrl.signal),
          getStats(ctrl.signal),
          getLatestMetric(ctrl.signal),
        ])
        if (!mounted) return
        setHealth(h)
        setStats(s)
        setMetric(m.row)
        setError(false)
      } catch {
        if (mounted) setError(true)
      }
    }
    load()
    const id = setInterval(load, 15_000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  const healthy = !!health?.healthy && !error
  const dotColor = error
    ? "var(--brand-error)"
    : healthy
    ? "var(--brand-success, #22c55e)"
    : "var(--brand-warning, #f59e0b)"
  const entropy = metric?.ent_bpb ?? 0
  const pct = Math.max(0, Math.min(100, ((entropy - 7) / 1) * 100))
  const events = stats?.last_extract_event_count ?? 0

  return (
    <Link href="/trng" aria-label="View TRNG dashboard">
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 cursor-pointer"
        style={{
          background: "var(--brand-bg-alt)",
          border: "1px solid var(--brand-border)",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio size={16} style={{ color: "var(--brand-primary)" }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--brand-muted)" }}>
              Hotbits TRNG
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: dotColor, opacity: healthy ? 0.4 : 0.2 }}
              />
              <span
                className="relative block w-2 h-2 rounded-full"
                style={{ background: dotColor }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: dotColor }}>
              {error ? "offline" : healthy ? "live" : "degraded"}
            </span>
          </div>
        </div>

        <div className="font-display text-xl sm:text-2xl font-bold leading-tight mb-1" style={{ color: "var(--brand-text)" }}>
          True randomness
        </div>
        <div className="text-sm mb-5" style={{ color: "var(--brand-muted)" }}>
          From radioactive decay · live on tinymachines.ai
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="font-mono text-lg font-bold" style={{ color: "var(--brand-primary)" }}>
              {events.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wide" style={{ color: "var(--brand-muted)" }}>
              decay events
            </div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold" style={{ color: "var(--brand-primary)" }}>
              {metric ? metric.ent_bpb.toFixed(3) : "—"}
              <span className="text-xs ml-1 opacity-60">/ 8</span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wide" style={{ color: "var(--brand-muted)" }}>
              entropy bpb
            </div>
          </div>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--brand-border)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="h-full"
            style={{ background: "var(--brand-primary)" }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-mono" style={{ color: "var(--brand-muted)" }}>
            Tap to inspect
          </span>
          <ArrowRight
            size={14}
            style={{ color: "var(--brand-primary)" }}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </motion.div>
    </Link>
  )
}
