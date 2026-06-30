// Decoder for `gps.satellites` — a gpsd SKY report (constellation + DOP).
// Hero shows used/visible counts, a sats-used trend sparkline, and a grid of
// dilution-of-precision vitals. Trend metric mirrors the collector's series (uSat).
import { TrendSpark } from "./TrendSpark"

type Sat = { ss?: number; used?: boolean }
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
