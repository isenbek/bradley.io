"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { getRandomHex } from "./api"

export function LiveBits() {
  const [hex, setHex] = useState<string>("")
  const [ts, setTs] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const mounted = useRef(true)

  const refresh = async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const r = await getRandomHex(256, signal)
      if (!mounted.current) return
      setHex(r.hex)
      setTs(Date.now())
    } catch {
      /* ignore — usually rate limit */
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    const ctrl = new AbortController()
    refresh(ctrl.signal)
    const id = setInterval(() => refresh(), 10_000)
    return () => {
      mounted.current = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  // Convert hex to bit grid (each byte → 8 cells)
  const bytes = hex.match(/.{2}/g) || []
  const bits = bytes.flatMap((h) => {
    const n = parseInt(h, 16)
    return Array.from({ length: 8 }, (_, i) => (n >> (7 - i)) & 1)
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
            Live Bits · 2048 fresh bits every 10s
          </h3>
          <div className="font-mono text-[10px] mt-1" style={{ color: "var(--brand-muted)" }}>
            {ts ? `updated ${Math.round((Date.now() - ts) / 1000)}s ago` : "loading…"}
          </div>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="rounded-md px-3 py-1.5 text-[11px] font-mono uppercase tracking-wide transition-all"
          style={{
            background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
            color: "var(--brand-primary)",
            border: "1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)",
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={11} className={`inline-block mr-1 ${loading ? "animate-spin" : ""}`} />
          pull
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={ts}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-px"
          style={{ gridTemplateColumns: "repeat(64, minmax(0, 1fr))" }}
        >
          {/* No per-cell stagger: `delay: i * 0.001` at 2048 cells sweeps a
              2-second wipe across the grid, which the eye reads as direction —
              a structure artifact, not entropy. Fade the whole grid in once. */}
          {bits.map((b, i) => (
            <div
              key={`${ts}-${i}`}
              className="aspect-square rounded-[1px]"
              style={{
                background: b
                  ? "var(--brand-primary)"
                  : "color-mix(in srgb, var(--brand-border) 60%, transparent)",
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="mt-3 font-mono text-[10px] break-all" style={{ color: "var(--brand-muted)" }}>
        {hex.slice(0, 96)}{hex.length > 96 ? "…" : ""}
      </div>
    </motion.div>
  )
}
