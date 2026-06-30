// Decoder for `gps.satellites` — a gpsd SKY report (constellation + DOP).
// Hero shows used/visible counts, a polar skyplot of the constellation, a
// sats-used trend sparkline, and a grid of dilution-of-precision vitals.
// Trend metric mirrors the collector's series (uSat).
import { TrendSpark } from "./TrendSpark"

type Sat = { PRN?: number; az?: number; el?: number; ss?: number; used?: boolean }
type Sky = {
  nSat?: number // satellites in view
  uSat?: number // satellites used in fix
  pdop?: number
  hdop?: number
  vdop?: number
  gdop?: number
  satellites?: Sat[]
}

function dop(v?: number): string {
  return v == null ? "—" : v.toFixed(2)
}

// SNR (dB) → 0..1, then red→amber→green (matches the mesh edge palette)
function ssStrength(ss: number): number {
  return Math.max(0, Math.min(1, (ss - 10) / 35)) // ~10..45 dB
}
function ssColor(s: number): string {
  return `hsl(${Math.round(s * 130)} 72% 55%)`
}

// Polar skyplot: zenith at center, horizon at the rim. Azimuth 0°=N at top,
// clockwise. Each satellite is a dot sized + colored by SNR; unused sats are
// dim hollow rings.
function SkyPlot({ sats }: { sats: Sat[] }) {
  const S = 220
  const PAD = 16
  const c = S / 2
  const R = c - PAD
  const rings = [0, 30, 60] // elevation circles (deg)
  const rFor = (el: number) => (R * (90 - Math.max(0, Math.min(90, el)))) / 90
  const pos = (az: number, el: number) => {
    const r = rFor(el)
    const a = (az * Math.PI) / 180
    return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) }
  }
  const plot = sats.filter((s) => typeof s.az === "number" && typeof s.el === "number")
  // draw unused first so used sats sit on top
  const ordered = [...plot].sort((a, b) => Number(a.used) - Number(b.used))

  return (
    <svg className="v3-we-sky" viewBox={`0 0 ${S} ${S}`} role="img" aria-label="GPS skyplot">
      {rings.map((el) => (
        <circle key={el} cx={c} cy={c} r={rFor(el)} className="v3-we-sky__ring" />
      ))}
      <line x1={c} y1={c - R} x2={c} y2={c + R} className="v3-we-sky__spoke" />
      <line x1={c - R} y1={c} x2={c + R} y2={c} className="v3-we-sky__spoke" />
      <text x={c} y={c - R - 5} textAnchor="middle" className="v3-we-sky__lbl">N</text>
      <text x={c + R + 6} y={c + 3} textAnchor="middle" className="v3-we-sky__lbl">E</text>
      <text x={c} y={c + R + 11} textAnchor="middle" className="v3-we-sky__lbl">S</text>
      <text x={c - R - 7} y={c + 3} textAnchor="middle" className="v3-we-sky__lbl">W</text>
      {ordered.map((s, i) => {
        const p = pos(s.az as number, s.el as number)
        const str = ssStrength(s.ss ?? 0)
        if (!s.used) {
          return <circle key={s.PRN ?? i} cx={p.x} cy={p.y} r={2.6} className="v3-we-sky__sat--off" />
        }
        return (
          <g key={s.PRN ?? i}>
            <circle cx={p.x} cy={p.y} r={3 + str * 2.6} fill={ssColor(str)} stroke="#0a0f15" strokeWidth={1} />
            <text x={p.x} y={p.y - 6} textAnchor="middle" className="v3-we-sky__prn">{s.PRN}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function GpsSatellites({ data, series }: { data: Sky; series?: number[] }) {
  const u = data.uSat ?? 0
  const n = data.nSat ?? 0
  const sats = data.satellites ?? []
  const bestSs = sats.reduce((mx, s) => Math.max(mx, s.ss ?? 0), 0)
  // a usable 3D fix needs ≥4 used satellites
  const ok = u >= 4

  return (
    <div className="v3-we-vitals">
      <div className="v3-we-vitals__hero">
        <span className={`v3-we-vitals__lamp ${ok ? "is-ok" : "is-warn"}`} aria-hidden />
        <div>
          <span className="v3-we-vitals__big">{u}<small>/{n}</small></span>
          <span className="v3-we-vitals__k">satellites used</span>
        </div>
        <span className="v3-we-vitals__tag">pdop {dop(data.pdop)}</span>
      </div>
      {sats.length ? <SkyPlot sats={sats} /> : null}
      {series && series.length > 1 ? (
        // sats-used count drifts around a mean — center on it, floor at 1 sat
        <TrendSpark series={series} label={`sats used, last ${series.length}`} floor={1} />
      ) : null}
      <dl className="v3-we-kv">
        <div><dt>hdop</dt><dd>{dop(data.hdop)}</dd></div>
        <div><dt>vdop</dt><dd>{dop(data.vdop)}</dd></div>
        <div><dt>gdop</dt><dd>{dop(data.gdop)}</dd></div>
        <div><dt>in view</dt><dd>{n}</dd></div>
        <div><dt>best SNR</dt><dd>{bestSs ? `${bestSs.toFixed(0)} dB` : "—"}</dd></div>
        <div><dt>used</dt><dd>{u}</dd></div>
      </dl>
    </div>
  )
}
