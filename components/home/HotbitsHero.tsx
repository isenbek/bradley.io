"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Atom, ArrowRight, Boxes } from "lucide-react"
import {
  getHealth,
  getStats,
  getMetricsWindow,
  type HealthResponse,
  type StatsResponse,
  type MetricRow,
} from "@/components/trng"

// NOTE: this panel reads ONLY the cheap, pool-free endpoints (/health, /stats,
// /metrics) — never /random/* — so the high-traffic home page can't drain the
// scarce radioactive entropy pool. See project_trng_entropy_pool.

function compact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B"
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K"
  return `${n}`
}

function Sparkline({ values }: { values: number[] }) {
  const { line, area } = useMemo(() => {
    if (values.length < 2) return { line: "", area: "" }
    const W = 100
    const H = 30
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * W
      const y = H - ((v - min) / span) * (H - 4) - 2
      return [x, y] as const
    })
    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")
    const area = `${line} L${W} ${H} L0 ${H} Z`
    return { line, area }
  }, [values])

  return (
    <svg className="v3-hotbits__spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="hotbits-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#13b8f3" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#13b8f3" stopOpacity="0" />
        </linearGradient>
      </defs>
      {area ? <path d={area} fill="url(#hotbits-spark)" /> : null}
      {line ? <path d={line} fill="none" stroke="#3fd0ff" strokeWidth="1.1" vectorEffect="non-scaling-stroke" /> : null}
    </svg>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="v3-hotbits__stat">
      <span className="v3-hotbits__stat-val">
        {value}
        {unit ? <span className="v3-hotbits__stat-unit">{unit}</span> : null}
      </span>
      <span className="v3-hotbits__stat-label">{label}</span>
    </div>
  )
}

export function HotbitsHero() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [rows, setRows] = useState<MetricRow[]>([])
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const loadCheap = async () => {
      try {
        const [h, s] = await Promise.all([getHealth(ctrl.signal), getStats(ctrl.signal)])
        if (!mounted) return
        setHealth(h)
        setStats(s)
        setOffline(false)
      } catch {
        if (mounted) setOffline(true)
      }
    }
    const loadMetrics = async () => {
      try {
        const w = await getMetricsWindow("24h", ctrl.signal)
        if (mounted) setRows(w.rows ?? [])
      } catch {
        /* handled by loadCheap */
      }
    }
    loadCheap()
    loadMetrics()
    const a = setInterval(loadCheap, 20_000)
    const b = setInterval(loadMetrics, 60_000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(a)
      clearInterval(b)
    }
  }, [])

  const latest = rows.length ? rows[rows.length - 1] : null
  // count rate (counts per minute) from the inter-arrival mean
  const cpm = latest && latest.mean_dt_ms > 0 ? 60_000 / latest.mean_dt_ms : null
  const cpmSeries = useMemo(
    () => rows.filter((r) => r.mean_dt_ms > 0).map((r) => 60_000 / r.mean_dt_ms),
    [rows]
  )
  const healthy = health?.healthy ?? stats?.l1_health_ok ?? true
  const live = !offline && (health?.logger_service_active ?? false)

  return (
    <article className="v3-hotbits">
      <div className="v3-hotbits__glow" aria-hidden />

      <div className="v3-hotbits__body">
        <span className="v3-hotbits__eyebrow">
          <Atom size={13} strokeWidth={2.4} />
          live · radioactive entropy
        </span>
        <h2 className="v3-hotbits__title">
          HOTBITS — true random,<br />
          from <span className="v3-hotbits__accent">nuclear decay.</span>
        </h2>
        <p className="v3-hotbits__lede">
          A Geiger counter watches a radioactive source; the gaps between decays
          become NIST-tested bits. No algorithm, no seed — just physics, served
          live.
        </p>

        <div className="v3-hotbits__stats">
          <Stat label="entropy" value={latest ? latest.ent_bpb.toFixed(2) : "—"} unit=" b/B" />
          <Stat label="count rate" value={cpm ? Math.round(cpm).toLocaleString() : "—"} unit=" cpm" />
          <Stat
            label="bits emitted"
            value={stats?.l1_total_bits_emitted != null ? compact(stats.l1_total_bits_emitted) : "—"}
          />
          <Stat
            label="χ² uniformity"
            value={latest ? latest.chi_pct.toFixed(0) : "—"}
            unit="%"
          />
        </div>

        <div className="v3-hotbits__cta">
          <Link href="/trng" className="v3-hotbits__btn v3-hotbits__btn--primary">
            Full HOTBITS stats <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
          <Link href="/trng/space" className="v3-hotbits__btn v3-hotbits__btn--ghost">
            <Boxes size={14} strokeWidth={2.4} /> See it in 3D
          </Link>
        </div>
      </div>

      <div className="v3-hotbits__viz">
        <div className="v3-hotbits__viz-head">
          <span className={`v3-hotbits__live ${live ? "is-live" : "is-off"}`}>
            <span className="v3-hotbits__live-dot" aria-hidden />
            {offline ? "source offline" : live ? "streaming" : "idle"}
          </span>
          <span className="v3-hotbits__viz-label">count rate · 24h</span>
        </div>
        <Sparkline values={cpmSeries} />
        <div className="v3-hotbits__viz-foot">
          <span>{healthy ? "NIST continuous: pass" : "NIST: check"}</span>
          <span>{rows.length ? `${rows.length} windows` : "warming up…"}</span>
        </div>
      </div>
    </article>
  )
}
