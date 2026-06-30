// Decoder for `gps.position` — a gpsd TPV (time/position/velocity) report.
// Hero shows the fix + altitude, with an altitude-trend sparkline and a grid of
// position vitals. Trend metric mirrors the collector's series (altMSL).
import { TrendSpark } from "./TrendSpark"

type Tpv = {
  mode?: number // 0/1 no fix, 2 = 2D, 3 = 3D
  lat?: number
  lon?: number
  altMSL?: number
  speed?: number // m/s
  track?: number // deg
  climb?: number // m/s
  eph?: number // horizontal error, m
  epv?: number // vertical error, m
}

const FIX: Record<number, string> = { 0: "no fix", 1: "no fix", 2: "2D", 3: "3D" }

function deg(v?: number): string {
  return v == null ? "—" : `${v.toFixed(5)}°`
}
function m(v?: number, d = 1): string {
  return v == null ? "—" : `${v.toFixed(d)} m`
}

export function GpsPosition({ data, series }: { data: Tpv; series?: number[] }) {
  const mode = data.mode ?? 0
  const fix = FIX[mode] ?? "?"
  const has3d = mode >= 3

  return (
    <div className="v3-we-vitals">
      <div className="v3-we-vitals__hero">
        <span className={`v3-we-vitals__lamp ${has3d ? "is-ok" : "is-warn"}`} aria-hidden />
        <div>
          <span className="v3-we-vitals__big">{m(data.altMSL)}</span>
          <span className="v3-we-vitals__k">altitude MSL</span>
        </div>
        <span className="v3-we-vitals__tag">{fix} fix</span>
      </div>
      {series && series.length > 1 ? (
        // altitude jitters around a stationary mean — center on it, floor at 1 m
        <TrendSpark series={series} label={`altitude, last ${series.length}`} floor={1} />
      ) : null}
      <dl className="v3-we-kv">
        <div><dt>lat</dt><dd>{deg(data.lat)}</dd></div>
        <div><dt>lon</dt><dd>{deg(data.lon)}</dd></div>
        <div><dt>speed</dt><dd>{data.speed == null ? "—" : `${data.speed.toFixed(2)} m/s`}</dd></div>
        <div><dt>track</dt><dd>{data.track == null ? "—" : `${data.track.toFixed(0)}°`}</dd></div>
        <div><dt>h err</dt><dd>{m(data.eph, 1)}</dd></div>
        <div><dt>v err</dt><dd>{m(data.epv, 1)}</dd></div>
      </dl>
    </div>
  )
}
