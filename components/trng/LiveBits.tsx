"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { getArchiveBytes } from "./api"

// /random/archive is a zero-pool, NON-CRYPTOGRAPHIC replay of the conditioned
// bit stream — the server seeks a random offset into the append-only
// bits_stream.bin, so it never touches the scarce fresh tip and never 503s on a
// low pool. So the public grid can just pull a fresh 256-byte (2048-bit) window
// every 10s — no buffer-replay workaround needed. Still visibility-gated: a
// backgrounded tab pulls nothing. (6 req/min, well under the 30/min limit.)
const WINDOW_BYTES = 256 // 2048 bits
const TICK_MS = 10_000

export function LiveBits() {
  const [win, setWin] = useState<Uint8Array>(new Uint8Array(0))
  const [gen, setGen] = useState(0) // bumps each pull → AnimatePresence key
  const [pulledAt, setPulledAt] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(false)
  const mounted = useRef(true)

  const pull = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const b = await getArchiveBytes(WINDOW_BYTES, undefined, signal)
      if (!mounted.current) return
      setWin(b)
      setGen((g) => g + 1)
      setPulledAt(Date.now())
      setErr(false)
    } catch {
      if (mounted.current) setErr(true)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    const ctrl = new AbortController()
    const hidden = () => document.visibilityState === "hidden"

    if (!hidden()) pull(ctrl.signal)
    const id = setInterval(() => {
      if (!hidden()) pull()
    }, TICK_MS)
    const onVis = () => {
      if (!hidden()) pull()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      mounted.current = false
      ctrl.abort()
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [pull])

  // bytes → bit grid
  const bits: number[] = []
  for (let i = 0; i < win.length; i++) {
    for (let b = 0; b < 8; b++) bits.push((win[i] >> (7 - b)) & 1)
  }
  const hex = Array.from(win, (b) => b.toString(16).padStart(2, "0")).join("")
  const agoLabel = err
    ? "archive unavailable"
    : pulledAt
      ? `pulled ${Math.round((Date.now() - pulledAt) / 1000)}s ago`
      : "loading…"

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
            Live Bits · 2048 bits from the archive, every 10s
          </h3>
          <div className="font-mono text-[10px] mt-1" style={{ color: "var(--brand-muted)" }}>
            {agoLabel}
          </div>
        </div>
        <button
          onClick={() => pull()}
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
          key={gen}
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
              key={`${gen}-${i}`}
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
