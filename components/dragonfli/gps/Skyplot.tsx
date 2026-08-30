"use client"

import { snrT, type Sat, type SatAgg } from "./stream"
import { SEQUENTIAL_HEX } from "@/lib/beta/chart-theme"

// Polar az/el dome: zenith at centre, horizon at the rim. Each satellite is a
// dot at (az, el), coloured by SNR; used sats get a ring. Empty until per-sat
// detail flows on /stream (tinymachines/adsb#2).
const SIZE = 320
const C = SIZE / 2
const R = 142

// SNR is magnitude, so it takes the same sequential ramp the maps and the
// charts use rather than a hand-rolled rgb() sweep of its own.
function snrColor(snr: number): string {
  const t = Math.max(0, Math.min(1, snrT(snr)))
  return SEQUENTIAL_HEX[Math.min(SEQUENTIAL_HEX.length - 1, Math.floor(t * SEQUENTIAL_HEX.length))]
}

function pos(az: number, el: number): [number, number] {
  const r = R * (1 - Math.max(0, Math.min(90, el)) / 90)
  const a = (az * Math.PI) / 180
  return [C + r * Math.sin(a), C - r * Math.cos(a)]
}

export function Skyplot({ sats, agg }: { sats: Sat[]; agg: SatAgg | null }) {
  const rings = [0, 30, 60] // elevation circles
  return (
    <div className="beta-gps-panel">
      <div className="beta-gps-panel__head">
        <span className="beta-gps-panel__title">Skyplot</span>
        <span className="beta-gps-panel__sub">az / el · SNR</span>
      </div>
      <div className="beta-gps-sky">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="beta-gps-sky__svg">
          {rings.map((el) => {
            const rr = R * (1 - el / 90)
            return <circle key={el} cx={C} cy={C} r={rr} className="beta-gps-sky__ring" />
          })}
          <line x1={C} y1={C - R} x2={C} y2={C + R} className="beta-gps-sky__cross" />
          <line x1={C - R} y1={C} x2={C + R} y2={C} className="beta-gps-sky__cross" />
          {(["N", "E", "S", "W"] as const).map((d, i) => {
            const [x, y] = [
              [C, C - R - 8],
              [C + R + 8, C],
              [C, C + R + 14],
              [C - R - 8, C],
            ][i] as [number, number]
            return (
              <text key={d} x={x} y={y} className="beta-gps-sky__card" textAnchor="middle">
                {d}
              </text>
            )
          })}
          {sats.map((s) => {
            const [x, y] = pos(s.az, s.el)
            return (
              <g key={s.prn}>
                {s.used && <circle cx={x} cy={y} r={8.5} className="beta-gps-sky__used" />}
                <circle cx={x} cy={y} r={6} fill={snrColor(s.snr)} />
                <text x={x} y={y + 3} className="beta-gps-sky__prn" textAnchor="middle">
                  {s.prn}
                </text>
              </g>
            )
          })}
        </svg>
        {sats.length === 0 && (
          <div className="beta-gps-empty">
            <span className="beta-gps-empty__dot" aria-hidden />
            {agg && agg.n_visible > 0
              ? `${agg.n_visible} visible · awaiting per-satellite detail`
              : "awaiting satellite fix"}
          </div>
        )}
      </div>
    </div>
  )
}
