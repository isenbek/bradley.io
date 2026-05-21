"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion } from "framer-motion"
import type { Band, Job, SoakBand } from "./api"

function Counter({
  value,
  label,
}: {
  value: number
  label: string
}) {
  const fmt = useCallback((v: number) => Math.round(v).toLocaleString(), [])
  const [display, setDisplay] = useState(() => fmt(value))
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) {
      setDisplay(fmt(value))
      return
    }
    const from = prev.current
    const to = value
    prev.current = value
    const duration = 900
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(fmt(from + (to - from) * eased))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, fmt])

  return (
    <div className="text-center">
      <div className="font-mono text-xl sm:text-3xl font-bold" style={{ color: "var(--brand-primary)" }}>
        {display}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wide mt-1" style={{ color: "var(--brand-muted)" }}>
        {label}
      </div>
    </div>
  )
}

interface Props {
  soak: SoakBand[]
  bands: Band[]
  jobs: Job[]
}

export function StatsCounters({ soak, bands, jobs }: Props) {
  const totalHits = soak.reduce((s, b) => s + b.n_hits, 0)
  const activeBands = bands.filter((b) => b.enabled).length
  const completed = jobs.filter((j) => j.status === "completed").length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <Counter value={totalHits} label="Total Hits" />
      <Counter value={soak.length} label="Soak Bands" />
      <Counter value={activeBands} label="Active Configs" />
      <Counter value={completed} label="Jobs Completed" />
    </motion.div>
  )
}
