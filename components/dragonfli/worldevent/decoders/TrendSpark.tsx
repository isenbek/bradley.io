// Shared offset-trend sparkline for decoder cards: a signed polyline plotted as
// deviation from a baseline (the series mean, or a fixed zero), with a dashed
// baseline line. Used by the mesh + gps cards; chrony keeps its own µs-scaled
// variant. Color "sign" diverges about the baseline: ocean above, burnt below.
// It was green/red, which read as good/bad and spent the palette's reserved
// failure colour on a node that was merely below its own average.

export function TrendSpark({
  series,
  label,
  baseline = "mean",
  floor = 1,
  color = "sign",
}: {
  series: number[]
  label: string
  baseline?: "mean" | "zero"
  floor?: number // amplitude floor so a steady signal stays calm (series units)
  color?: "sign" | string
}) {
  const w = 200
  const h = 34
  const center = baseline === "zero" ? 0 : series.reduce((a, b) => a + b, 0) / series.length
  const dev = series.map((v) => v - center)
  const amp = Math.max(floor, ...dev.map((v) => Math.abs(v)))
  const n = dev.length
  const step = n > 1 ? w / (n - 1) : w
  const y = (v: number) => h / 2 - (v / amp) * (h / 2 - 2)
  const pts = dev.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  const latest = dev[dev.length - 1] ?? 0
  const stroke =
    color === "sign" ? `var(--color-${latest >= 0 ? "ocean" : "burnt"})` : color
  return (
    <div className="beta-we-trend">
      <svg className="beta-we-trend__spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} className="beta-we-trend__zero" />
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="beta-we-trend__k">{label}</span>
    </div>
  )
}
