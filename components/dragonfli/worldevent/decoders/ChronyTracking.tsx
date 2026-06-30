// Decoder for `chrony.tracking` — NTP/chrony clock-sync telemetry.
// Renders the system clock offset as a hero + a grid of sync vitals.

type Chrony = {
  ref_id_hex?: string
  ref_address?: string
  stratum?: number
  system_time_offset?: number
  last_offset?: number
  rms_offset?: number
  frequency_ppm?: number
  residual_freq_ppm?: number
  skew_ppm?: number
  root_delay?: number
  root_dispersion?: number
  update_interval?: number
  leap_status?: string
}

// signed sparkline centered on a zero baseline — for the clock-offset trend
function OffsetSpark({ series }: { series: number[] }) {
  const w = 200
  const h = 34
  const us = series.map((s) => s * 1e6) // seconds → µs
  const amp = Math.max(50, ...us.map((v) => Math.abs(v))) // floor so a steady clock stays calm
  const n = us.length
  const step = n > 1 ? w / (n - 1) : w
  const y = (v: number) => h / 2 - (v / amp) * (h / 2 - 2)
  const pts = us.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  return (
    <svg className="v3-we-chrony__spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <line x1={0} y1={h / 2} x2={w} y2={h / 2} className="v3-we-chrony__zero" />
      <polyline points={pts} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function us(seconds?: number): string {
  if (seconds == null) return "—"
  const u = seconds * 1e6
  if (Math.abs(u) >= 1000) return `${(u / 1000).toFixed(2)} ms`
  return `${u >= 0 ? "+" : ""}${u.toFixed(0)} µs`
}
function ms(seconds?: number): string {
  if (seconds == null) return "—"
  return `${(seconds * 1000).toFixed(2)} ms`
}

export function ChronyTracking({ data, series }: { data: Chrony; series?: number[] }) {
  // root distance — the standard max-error bound chrony exposes
  const rootDist = (data.root_delay ?? 0) / 2 + (data.root_dispersion ?? 0)
  const off = data.system_time_offset ?? 0
  const synced = Math.abs(off) < 1e-3 && (data.leap_status ?? "Normal") === "Normal"

  return (
    <div className="v3-we-chrony">
      <div className="v3-we-chrony__hero">
        <span className={`v3-we-chrony__lamp ${synced ? "is-ok" : "is-warn"}`} aria-hidden />
        <div>
          <span className="v3-we-chrony__off">{us(off)}</span>
          <span className="v3-we-chrony__offk">system clock offset</span>
        </div>
        <span className="v3-we-chrony__stratum">S{data.stratum ?? "?"}</span>
      </div>
      {series && series.length > 1 ? (
        <div className="v3-we-chrony__trend">
          <OffsetSpark series={series} />
          <span className="v3-we-chrony__trendk">offset, last {series.length}</span>
        </div>
      ) : null}
      <dl className="v3-we-kv">
        <div><dt>ref</dt><dd>{data.ref_address ?? data.ref_id_hex ?? "—"}</dd></div>
        <div><dt>rms offset</dt><dd>{us(data.rms_offset)}</dd></div>
        <div><dt>root dist</dt><dd>{ms(rootDist)}</dd></div>
        <div><dt>skew</dt><dd>{(data.skew_ppm ?? 0).toFixed(2)} ppm</dd></div>
        <div><dt>freq</dt><dd>{(data.frequency_ppm ?? 0).toFixed(2)} ppm</dd></div>
        <div><dt>poll</dt><dd>{data.update_interval ? `${Math.round(data.update_interval)}s` : "—"}</dd></div>
        <div><dt>leap</dt><dd>{data.leap_status ?? "—"}</dd></div>
      </dl>
    </div>
  )
}
