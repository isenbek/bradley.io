"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import {
  StatusHero,
  StatsCounters,
  AircraftList,
  RadarMap,
  RegistryBreakdown,
  PredictorPanel,
  getHealth,
  getReceiver,
  getActive,
  getRegistryStats,
  getPredictStatus,
  type HealthResponse,
  type ReceiverFix,
  type Aircraft,
  type RegistryStats,
  type PredictStatus,
} from "@/components/dragonfli"

export default function DragonfliPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [receiver, setReceiver] = useState<ReceiverFix | null>(null)
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [registry, setRegistry] = useState<RegistryStats | null>(null)
  const [predict, setPredict] = useState<PredictStatus | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()

    const loadFast = async () => {
      try {
        const [h, r, a] = await Promise.all([
          getHealth(ctrl.signal),
          getReceiver(ctrl.signal),
          getActive(ctrl.signal),
        ])
        if (!mounted) return
        setHealth(h)
        setReceiver(r)
        setAircraft(a.aircraft)
        setError(false)
      } catch {
        if (mounted) setError(true)
      }
    }

    const loadSlow = async () => {
      try {
        const [rs, ps] = await Promise.all([
          getRegistryStats(ctrl.signal),
          getPredictStatus(ctrl.signal),
        ])
        if (!mounted) return
        setRegistry(rs)
        setPredict(ps)
      } catch {
        /* handled by loadFast */
      }
    }

    loadFast()
    loadSlow()
    const fast = setInterval(loadFast, 5_000)
    const slow = setInterval(loadSlow, 60_000)

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
        <StatusHero health={health} receiver={receiver} error={error} />
        <StatsCounters health={health} registry={registry} />
        <RadarMap aircraft={aircraft} receiver={receiver} />
        <AircraftList aircraft={aircraft} />
        <RegistryBreakdown stats={registry} />
        <PredictorPanel status={predict} />

        <div
          className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
        >
          <div>
            <div className="font-mono text-xs uppercase tracking-wide mb-1" style={{ color: "var(--brand-muted)" }}>
              Build your own
            </div>
            <div className="text-sm" style={{ color: "var(--brand-text)" }}>
              Raspberry Pi · 1090 MHz ADS-B receiver · WorldEvent UDP firehose · FAA registry enrichment
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="https://dragonfli.tinymachines.ai/docs"
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
          </div>
        </div>
      </div>
    </div>
  )
}
