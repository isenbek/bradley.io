// Decoder for `adsb.uat` — a single UAT (978 MHz) ADS-B contact. Distinct from
// adsb.mode_s (raw hex): UAT carries a full state vector. Hero = ground speed +
// ICAO identity; a heading compass points along the true track (climb/descent
// tinted); a vitals grid carries altitude, track, vertical rate, and link RSSI.

type Meta = { rssi?: number; errors?: number; received_at?: number }
type Uat = {
  address?: string
  address_qualifier?: string
  airground_state?: string
  ground_speed?: number // kt
  true_track?: number // deg
  pressure_altitude?: number // ft
  vertical_velocity_geometric?: number // fpm (+up)
  nic?: number
  metadata?: Meta
}

// RSSI → red→amber→green, matching the mesh/skyplot palette. UAT link levels
// sit high (close aircraft ~-30, distant ~-80).
function rssiColor(rssi: number): string {
  const s = Math.max(0, Math.min(1, (rssi - -85) / (-30 - -85)))
  return `hsl(${Math.round(s * 130)} 72% 58%)`
}

function num(v?: number): string {
  return typeof v === "number" ? v.toLocaleString("en-US") : "—"
}

// Heading compass: N up, clockwise. An aircraft glyph rotated to the true track,
// tinted by vertical trend (climb green · descent amber · level blue).
function HeadingRose({ track, vv }: { track: number; vv?: number }) {
  const S = 200
  const c = S / 2
  const R = c - 16
  const rings = [R, R * 0.6]
  const tint =
    vv != null && vv > 100 ? "#22c55e" : vv != null && vv < -100 ? "#f59e0b" : "#38bdf8"

  // a small plane glyph pointing north, then rotate by the track
  const glyph = [
    [0, -30],
    [13, 16],
    [0, 6],
    [-13, 16],
  ]
  const a = (track * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const pts = glyph
    .map(([x, y]) => `${(c + x * cos - y * sin).toFixed(1)},${(c + x * sin + y * cos).toFixed(1)}`)
    .join(" ")

  return (
    <svg className="v3-we-sky" viewBox={`0 0 ${S} ${S}`} role="img" aria-label="UAT heading compass">
      {rings.map((r) => (
        <circle key={r} cx={c} cy={c} r={r} className="v3-we-sky__ring" />
      ))}
      <line x1={c} y1={c - R} x2={c} y2={c + R} className="v3-we-sky__spoke" />
      <line x1={c - R} y1={c} x2={c + R} y2={c} className="v3-we-sky__spoke" />
      <text x={c} y={c - R - 5} textAnchor="middle" className="v3-we-sky__lbl">N</text>
      <text x={c + R + 6} y={c + 3} textAnchor="middle" className="v3-we-sky__lbl">E</text>
      <text x={c} y={c + R + 11} textAnchor="middle" className="v3-we-sky__lbl">S</text>
      <text x={c - R - 7} y={c + 3} textAnchor="middle" className="v3-we-sky__lbl">W</text>
      <polygon points={pts} fill={tint} stroke="#0a0f15" strokeWidth={1.2} />
    </svg>
  )
}

export function AdsbUat({ data }: { data: Uat }) {
  const airborne = (data.airground_state ?? "").toLowerCase().includes("air")
  const rssi = data.metadata?.rssi
  const vv = data.vertical_velocity_geometric
  const track = data.true_track
  const qual = (data.address_qualifier ?? "").replace(/^adsb_/, "")

  return (
    <div className="v3-we-vitals">
      <div className="v3-we-vitals__hero">
        <span className={`v3-we-vitals__lamp ${airborne ? "is-ok" : "is-warn"}`} aria-hidden />
        <div>
          <span className="v3-we-vitals__big">
            {num(data.ground_speed)}<small> kt</small>
          </span>
          <span className="v3-we-vitals__k">
            ground speed · {airborne ? "airborne" : "ground"}
          </span>
        </div>
        <span className="v3-we-vitals__tag">{(data.address ?? "??????").toUpperCase()}</span>
      </div>

      {typeof track === "number" ? <HeadingRose track={track} vv={vv} /> : null}

      <dl className="v3-we-kv">
        <div><dt>altitude</dt><dd>{data.pressure_altitude != null ? `${num(data.pressure_altitude)} ft` : "—"}</dd></div>
        <div><dt>track</dt><dd>{typeof track === "number" ? `${track.toFixed(0)}°` : "—"}</dd></div>
        <div>
          <dt>vert rate</dt>
          <dd>{vv != null ? `${vv > 0 ? "↑" : vv < 0 ? "↓" : ""}${num(Math.abs(vv))} fpm` : "—"}</dd>
        </div>
        <div>
          <dt>rssi</dt>
          <dd style={{ color: rssi != null ? rssiColor(rssi) : undefined }}>
            {rssi != null ? `${rssi.toFixed(0)} dBm` : "—"}
          </dd>
        </div>
        <div><dt>nic</dt><dd>{num(data.nic)}</dd></div>
        <div><dt>source</dt><dd>{qual || "—"}</dd></div>
      </dl>
    </div>
  )
}
