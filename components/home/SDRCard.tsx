"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Radio } from "lucide-react"
import {
  getHealth,
  getSoak,
  type HealthResponse,
  type SoakBand,
} from "@/components/sdr/api"

export function SDRCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [soak, setSoak] = useState<SoakBand[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const load = async () => {
      try {
        const [h, s] = await Promise.all([
          getHealth(ctrl.signal),
          getSoak(ctrl.signal),
        ])
        if (!mounted) return
        setHealth(h)
        setSoak(s)
        setError(false)
      } catch {
        if (mounted) setError(true)
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  const ok = !!health && health.status === "ok" && !error
  const color = error
    ? "var(--brand-error)"
    : ok
    ? "var(--brand-success, #22c55e)"
    : "var(--brand-warning, #f59e0b)"

  const totalHits = soak.reduce((s, b) => s + b.n_hits, 0)

  return (
    <Link href="/sdr" aria-label="View SDR dashboard">
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 cursor-pointer h-full"
        style={{
          background: "var(--brand-bg-alt)",
          border: "1px solid var(--brand-border)",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio size={16} style={{ color: "var(--brand-primary)" }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--brand-muted)" }}>
              sdr-api · scanner
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: color, opacity: ok ? 0.4 : 0.2 }}
              />
              <span
                className="relative block w-2 h-2 rounded-full"
                style={{ background: color }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color }}>
              {error ? "offline" : ok ? "live" : "degraded"}
            </span>
          </div>
        </div>

        <div className="font-display text-xl sm:text-2xl font-bold leading-tight mb-1" style={{ color: "var(--brand-text)" }}>
          Radio sweeps
        </div>
        <div className="text-sm mb-5" style={{ color: "var(--brand-muted)" }}>
          rtl-sdr · airband · cell · LoRa · NOAA wx
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="font-mono text-lg font-bold" style={{ color: "var(--brand-primary)" }}>
              {totalHits.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wide" style={{ color: "var(--brand-muted)" }}>
              soak hits
            </div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold" style={{ color: "var(--brand-primary)" }}>
              {soak.length}
              <span className="text-xs ml-1 opacity-60">bands</span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wide" style={{ color: "var(--brand-muted)" }}>
              v{health?.version ?? "—"}
            </div>
          </div>
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
