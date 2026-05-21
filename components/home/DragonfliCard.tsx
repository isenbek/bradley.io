"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Plane } from "lucide-react"
import {
  getHealth,
  getReceiver,
  type HealthResponse,
  type ReceiverFix,
} from "@/components/dragonfli/api"

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  if (d > 0) return `${d}d`
  if (h > 0) return `${h}h`
  return "<1h"
}

export function DragonfliCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [receiver, setReceiver] = useState<ReceiverFix | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const load = async () => {
      try {
        const [h, r] = await Promise.all([
          getHealth(ctrl.signal),
          getReceiver(ctrl.signal),
        ])
        if (!mounted) return
        setHealth(h)
        setReceiver(r)
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

  const fresh = !!health && health.last_event_age_s < 5 && !error
  const color = error
    ? "var(--brand-error)"
    : fresh
    ? "var(--brand-success, #22c55e)"
    : "var(--brand-warning, #f59e0b)"
  const active = health?.n_aircraft_active ?? 0

  return (
    <Link href="/dragonfli" aria-label="View dragonfli dashboard">
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
            <Plane size={16} style={{ color: "var(--brand-primary)" }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--brand-muted)" }}>
              dragonfli · ADS-B
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: color, opacity: fresh ? 0.4 : 0.2 }}
              />
              <span
                className="relative block w-2 h-2 rounded-full"
                style={{ background: color }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color }}>
              {error ? "offline" : fresh ? "live" : "quiet"}
            </span>
          </div>
        </div>

        <div className="font-display text-xl sm:text-2xl font-bold leading-tight mb-1" style={{ color: "var(--brand-text)" }}>
          Live aircraft tracker
        </div>
        <div className="text-sm mb-5" style={{ color: "var(--brand-muted)" }}>
          Pi receiver + FAA enrichment + ML predictor
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="font-mono text-lg font-bold" style={{ color: "var(--brand-primary)" }}>
              {active}
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wide" style={{ color: "var(--brand-muted)" }}>
              aircraft now
            </div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold" style={{ color: "var(--brand-primary)" }}>
              {(health?.received ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wide" style={{ color: "var(--brand-muted)" }}>
              events · {health ? formatUptime(health.uptime_s) : "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-mono truncate" style={{ color: "var(--brand-muted)" }}>
            {receiver ? `${receiver.lat.toFixed(2)}°, ${receiver.lon.toFixed(2)}°` : "Tap to inspect"}
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
