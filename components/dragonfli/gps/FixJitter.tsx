"use client"

import { useMemo } from "react"
import type { Tpv } from "./stream"

// Recent fixes plotted as offsets (metres) from their mean — the precision
// cloud of a static receiver. The ring is CEP (median radial error).
const SIZE = 300
const C = SIZE / 2
const PAD = 28

export function FixJitter({ history }: { history: Tpv[] }) {
  const model = useMemo(() => {
    if (history.length < 2) return null
    const meanLat = history.reduce((a, p) => a + p.lat, 0) / history.length
    const meanLon = history.reduce((a, p) => a + p.lon, 0) / history.length
    const mPerLat = 111_320
    const mPerLon = 111_320 * Math.cos((meanLat * Math.PI) / 180)
    const pts = history.map((p) => ({
      x: (p.lon - meanLon) * mPerLon,
      y: (p.lat - meanLat) * mPerLat,
    }))
    const radii = pts.map((p) => Math.hypot(p.x, p.y)).sort((a, b) => a - b)
    const cep = radii[Math.floor(radii.length / 2)] || 0
    const maxR = Math.max(radii[radii.length - 1] || 1, cep, 1)
    const scale = (C - PAD) / maxR
    return { pts, cep, scale, maxR }
  }, [history])

  return (
    <div className="v3-gps-panel">
      <div className="v3-gps-panel__head">
        <span className="v3-gps-panel__title">Fix jitter</span>
        <span className="v3-gps-panel__sub">{model ? `CEP ≈ ${model.cep.toFixed(1)} m` : "precision"}</span>
      </div>
      <div className="v3-gps-jitter">
        {model ? (
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="v3-gps-jitter__svg">
            <line x1={C} y1={PAD} x2={C} y2={SIZE - PAD} className="v3-gps-sky__cross" />
            <line x1={PAD} y1={C} x2={SIZE - PAD} y2={C} className="v3-gps-sky__cross" />
            <circle cx={C} cy={C} r={model.cep * model.scale} className="v3-gps-jitter__cep" />
            {model.pts.map((p, i) => (
              <circle
                key={i}
                cx={C + p.x * model.scale}
                cy={C - p.y * model.scale}
                r={1.7}
                className="v3-gps-jitter__pt"
                style={{ opacity: 0.25 + (i / model.pts.length) * 0.75 }}
              />
            ))}
            <circle cx={C} cy={C} r={2.6} className="v3-gps-jitter__mean" />
          </svg>
        ) : (
          <div className="v3-gps-empty">
            <span className="v3-gps-empty__dot" aria-hidden />
            awaiting GPS fix
          </div>
        )}
      </div>
    </div>
  )
}
