"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { getEntropyBytes, PoolLowError } from "./api"

// The /random pool is a SCARCE physical resource (~3 B/s from a radioactive
// source, ~14 KB fresh at any time). A decorative grid must not hammer it, so
// the public site "rewinds into the old pool": pull ONE buffer, then resample a
// random window of it for the animation ("start somewhere"), and only re-pull
// from the pool on a slow cadence. Everything is gated on tab visibility — a
// backgrounded tab draws nothing. Mirrors the shared-buffer model on /trng/space.
const BUFFER_BYTES = 1024 // pulled from the pool at most once per REFILL_MS
const WINDOW_BYTES = 256 //  2048 bits shown in the grid
const RESAMPLE_MS = 10_000 // re-window the local buffer (no network)
const REFILL_MS = 120_000 //  actually re-pull fresh entropy from the pool

export function LiveBits() {
  const [win, setWin] = useState<Uint8Array>(new Uint8Array(0))
  const [gen, setGen] = useState(0) // bumps each (re)sample → AnimatePresence key
  const [pulledAt, setPulledAt] = useState(0)
  const [loading, setLoading] = useState(false)
  const [poolLow, setPoolLow] = useState(false)

  const bufRef = useRef<Uint8Array>(new Uint8Array(0))
  const lastPullRef = useRef(0)
  const mounted = useRef(true)

  // Show a random window of the buffer — "start somewhere in the old pool".
  const resample = useCallback(() => {
    const buf = bufRef.current
    if (buf.length < WINDOW_BYTES) return
    const off = Math.floor(Math.random() * (buf.length - WINDOW_BYTES + 1))
    setWin(buf.slice(off, off + WINDOW_BYTES))
    setGen((g) => g + 1)
  }, [])

  // Pull a fresh buffer from the scarce pool (mount / slow refill / manual).
  const refill = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const buf = await getEntropyBytes(BUFFER_BYTES, signal)
      if (!mounted.current) return
      bufRef.current = buf
      lastPullRef.current = Date.now()
      setPulledAt(Date.now())
      setPoolLow(false)
      const off = Math.floor(Math.random() * Math.max(1, buf.length - WINDOW_BYTES + 1))
      setWin(buf.slice(off, off + WINDOW_BYTES))
      setGen((g) => g + 1)
    } catch (e) {
      if (!mounted.current) return
      if (e instanceof PoolLowError) setPoolLow(true) // keep showing the last buffer
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    const ctrl = new AbortController()
    const hidden = () => document.visibilityState === "hidden"

    // Initial pull only if the tab is actually visible.
    if (!hidden()) refill(ctrl.signal)

    const resampleId = setInterval(() => {
      if (!hidden()) resample()
    }, RESAMPLE_MS)
    const refillId = setInterval(() => {
      if (!hidden()) refill()
    }, REFILL_MS)

    // Coming back to a foregrounded tab: refresh promptly (re-pull if stale).
    const onVis = () => {
      if (hidden()) return
      if (Date.now() - lastPullRef.current > REFILL_MS) refill()
      else resample()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      mounted.current = false
      ctrl.abort()
      clearInterval(resampleId)
      clearInterval(refillId)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [refill, resample])

  // bytes → bit grid
  const bits: number[] = []
  for (let i = 0; i < win.length; i++) {
    for (let b = 0; b < 8; b++) bits.push((win[i] >> (7 - b)) & 1)
  }
  const hex = Array.from(win, (b) => b.toString(16).padStart(2, "0")).join("")
  const agoLabel = poolLow
    ? "pool replenishing…"
    : pulledAt
      ? `pool pull ${Math.round((Date.now() - pulledAt) / 1000)}s ago`
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
            Live Bits · 2048-bit window, resampled every 10s
          </h3>
          <div className="font-mono text-[10px] mt-1" style={{ color: "var(--brand-muted)" }}>
            {agoLabel}
          </div>
        </div>
        <button
          onClick={() => refill()}
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
