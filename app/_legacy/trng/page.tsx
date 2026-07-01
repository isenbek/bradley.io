"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import {
  StatusHero,
  StatsCounters,
  QualityGauges,
  MetricsChart,
  NISTPanel,
  BatteryStrip,
  getHealth,
  getStats,
  getLatestMetric,
  getMetrics,
  getContinuous,
  getBattery,
  type HealthResponse,
  type StatsResponse,
  type MetricRow,
  type ContinuousHealth,
  type BatteryRow,
} from "@/components/trng"

export default function TRNGPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [metric, setMetric] = useState<MetricRow | null>(null)
  const [series, setSeries] = useState<MetricRow[]>([])
  const [cont, setCont] = useState<ContinuousHealth | null>(null)
  const [battery, setBattery] = useState<BatteryRow[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()

    const loadFast = async () => {
      try {
        const [h, s, c] = await Promise.all([
          getHealth(ctrl.signal),
          getStats(ctrl.signal),
          getContinuous(ctrl.signal),
        ])
        if (!mounted) return
        setHealth(h)
        setStats(s)
        setCont(c)
        setError(false)
      } catch {
        if (mounted) setError(true)
      }
    }

    const loadSlow = async () => {
      try {
        const [l, m, b] = await Promise.all([
          getLatestMetric(ctrl.signal),
          getMetrics("24h", ctrl.signal),
          getBattery(30, ctrl.signal),
        ])
        if (!mounted) return
        setMetric(l.row)
        setSeries(m)
        setBattery(b.rows)
      } catch {
        /* errors handled by loadFast */
      }
    }

    loadFast()
    loadSlow()
    const fast = setInterval(loadFast, 5_000)
    const slow = setInterval(loadSlow, 30_000)

    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(fast)
      clearInterval(slow)
    }
  }, [])

  return (
    <div className="pt-16 sm:pt-20 pb-10 sm:pb-16">
      <div className="container-page space-y-4 sm:space-y-6">
        <StatusHero health={health} stats={stats} error={error} />
        <StatsCounters stats={stats} cont={cont} metric={metric} />
        <QualityGauges metric={metric} />
        {series.length > 1 && <MetricsChart data={series} />}
        <NISTPanel cont={cont} />
        {battery.length > 0 && <BatteryStrip rows={battery} />}

        <div
          className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
        >
          <div>
            <div className="font-mono text-xs uppercase tracking-wide mb-1" style={{ color: "var(--brand-muted)" }}>
              Build your own
            </div>
            <div className="text-sm" style={{ color: "var(--brand-text)" }}>
              CAJOE Geiger counter · Raspberry Pi 4 · Δt₁/Δt₂ comparison · SHA-256 conditioning
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="https://hotbits.tinymachines.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-wide"
              style={{
                background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                color: "var(--brand-primary)",
                border: "1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)",
              }}
            >
              API <ExternalLink size={11} />
            </Link>
            <Link
              href="https://github.com/tinymachines/geiger"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-wide"
              style={{
                background: "var(--brand-bg)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
              }}
            >
              Source <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
