"use client"

import { useEffect, useRef, useState } from "react"

interface Latest {
  ts: string
  cam: string
  delta: number
  w: number
  h: number
  grid: number[]
  bbox: number[] | null
  peak: number[] | null
}
interface Row {
  ts: string
  delta: number
}

const FLOOR = 6 // motion threshold above the sensor-noise floor (~4–5)

export function MotionTrack() {
  const [latest, setLatest] = useState<Latest | null>(null)
  const [history, setHistory] = useState<Row[]>([])
  const [dead, setDead] = useState(false)
  const [frameSrc, setFrameSrc] = useState("/delta-frame.jpg")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let mounted = true
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/delta", { cache: "no-store" })
        if (!r.ok) throw new Error("offline")
        const d = await r.json()
        if (!mounted) return
        if (!d.latest) throw new Error("no data")
        setLatest(d.latest)
        setHistory(d.history || [])
        setDead(false)
        setFrameSrc(`/delta-frame.jpg?t=${Date.now()}`)
      } catch {
        if (mounted) setDead(true)
      }
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  // Draw the heatmap grid + changed-region box onto the overlay canvas.
  useEffect(() => {
    const c = canvasRef.current
    if (!c || !latest?.grid?.length) return
    const { w, h, grid, bbox } = latest
    c.width = w
    c.height = h
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = grid[y * w + x]
        const a = Math.min(0.72, Math.max(0, (v - 8) / 60))
        if (a <= 0.02) continue
        const heat = Math.min(1, v / 80)
        ctx.fillStyle = `rgba(255, ${Math.round(190 - 150 * heat)}, 50, ${a})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
    if (bbox) {
      ctx.strokeStyle = "rgba(255, 90, 90, 0.95)"
      ctx.lineWidth = 0.35
      ctx.strokeRect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1])
    }
  }, [latest])

  const deltas = history.map((r) => r.delta)
  const max = Math.max(8, ...deltas)
  const pts =
    deltas.length > 1
      ? deltas
          .map(
            (d, i) =>
              `${((i / (deltas.length - 1)) * 100).toFixed(2)},${(100 - (d / max) * 100).toFixed(2)}`
          )
          .join(" ")
      : ""
  const cur = latest?.delta ?? 0
  const moving = cur > FLOOR

  return (
    <figure className="v3-motion">
      <div className="v3-motion__frame">
        {dead ? (
          <div className="v3-motion__dead">motion tracker offline</div>
        ) : (
          <>
            <img src={frameSrc} alt="the tracked camera frame, with a motion heatmap overlay" />
            <canvas ref={canvasRef} className="v3-motion__heat" />
            <span className={`v3-motion__badge${moving ? " is-moving" : ""}`}>
              <span className="v3-motion__dot" aria-hidden />Δ {cur.toFixed(1)} · {moving ? "motion" : "still"}
            </span>
          </>
        )}
      </div>
      {pts ? (
        <svg className="v3-motion__curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points={pts} fill="none" />
        </svg>
      ) : null}
      <figcaption>
        frame-to-frame motion · heatmap shows <em>where</em> it changed · curve = last {deltas.length} samples
      </figcaption>
    </figure>
  )
}
