"use client"

import { useEffect, useRef, useState } from "react"

// Live frame viewer. Polls /api/eyes/meta for the newest snapshot epoch and only
// swaps the <img> when a fresh frame has actually landed (cache-busted by epoch),
// so we never re-fetch the same JPEG. Visibility-gated; degrades gracefully when
// the snapshot timer hasn't produced a frame yet.
interface Meta {
  ts: string
  epoch: number
  size: string
  bytes: number
  device: string
}

export function EyesLive() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [err, setErr] = useState(false)
  const [ago, setAgo] = useState("")
  const epochRef = useRef<number>(0)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/eyes/meta", { cache: "no-store", signal: ctrl.signal })
        if (!r.ok) throw new Error("no frame")
        const m: Meta = await r.json()
        if (!mounted) return
        setErr(false)
        setMeta(m)
        if (m.epoch !== epochRef.current) {
          epochRef.current = m.epoch
          setSrc(`/api/eyes?t=${m.epoch}`)
        }
      } catch {
        if (mounted) setErr(true)
      }
    }
    tick()
    const id = setInterval(tick, 15000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  // "captured Xs ago" — tick the relative label every second off the frame epoch.
  useEffect(() => {
    if (!meta) return
    const fmt = () => {
      const s = Math.max(0, Math.round(Date.now() / 1000 - meta.epoch))
      setAgo(s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ${s % 60}s ago`)
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [meta])

  return (
    <div className="beta-cam">
      {src && !err ? (
        <img className="beta-cam__frame" src={src} alt="Live camera frame from the bradley.io box" />
      ) : (
        <div className="beta-cam__warm">
          <span className="beta-cam__warm-dot" aria-hidden />
          {err ? "sensor offline, frame unavailable" : "warming up the sensor…"}
        </div>
      )}

      <div className="beta-cam__hud beta-cam__hud--tl">
        <span className="beta-cam__live">
          <span className="beta-cam__dot" aria-hidden />
          live
        </span>
      </div>

      {meta && (
        <div className="beta-cam__hud beta-cam__hud--tr">
          <span className="beta-cam__meta">{meta.device}</span>
          <span className="beta-cam__meta beta-cam__meta--dim">{meta.size}</span>
        </div>
      )}

      {meta && !err && (
        <div className="beta-cam__hud beta-cam__hud--b">
          <span className="beta-cam__cap">captured {ago}</span>
          <span className="beta-cam__cap beta-cam__cap--dim">· new frame every ~60s</span>
        </div>
      )}
    </div>
  )
}
