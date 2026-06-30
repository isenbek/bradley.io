// Decoder for `mesh.rssi_map` — a wireless mesh as a node-link graph.
// Nodes carry pre-computed {x,y} layout + cluster; links carry pairwise RSSI (dBm).
// Edges are colored + weighted by signal strength; nodes colored by cluster.

type Node = { id: string; x: number; y: number; cluster?: string }
type Link = { a: string; b: string; rssi: number }
type Mesh = { units?: number; nodes?: Node[]; links?: Link[] }

const W = 460
const H = 240
const PAD = 22

// RSSI → 0..1 strength (~-90 dBm weak … ~-25 dBm strong)
function strength(rssi: number): number {
  const s = (rssi - -90) / (-25 - -90)
  return Math.max(0, Math.min(1, s))
}
// strength → red→amber→green
function edgeColor(s: number): string {
  return `hsl(${Math.round(s * 130)} 72% 55%)`
}

const CLUSTER_HUE: Record<string, number> = { A: 205, B: 268 }
function clusterHue(c?: string): number {
  if (c && c in CLUSTER_HUE) return CLUSTER_HUE[c]
  // stable hue for any other cluster label
  let h = 0
  for (let i = 0; i < (c ?? "").length; i++) h = (h * 31 + (c ?? "").charCodeAt(i)) % 360
  return h
}

// signed sparkline centered on the series mean — the mean-RSSI trend.
// RSSI sits around -60 dBm, so we center on the running mean (not zero) and
// plot deviation from it, mirroring the chrony offset-trend style.
function RssiSpark({ series }: { series: number[] }) {
  const w = 200
  const h = 34
  const center = series.reduce((a, b) => a + b, 0) / series.length
  const dev = series.map((v) => v - center)
  const amp = Math.max(2, ...dev.map((v) => Math.abs(v))) // floor so a steady mesh stays calm
  const n = dev.length
  const step = n > 1 ? w / (n - 1) : w
  const y = (v: number) => h / 2 - (v / amp) * (h / 2 - 2)
  const pts = dev.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  // green when the latest sample is above the mean (signal improving), red below
  const latest = dev[dev.length - 1]
  const stroke = `hsl(${latest >= 0 ? 130 : 0} 72% 55%)`
  return (
    <svg className="v3-we-mesh__spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <line x1={0} y1={h / 2} x2={w} y2={h / 2} className="v3-we-mesh__zero" />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function MeshRssiMap({ data, series }: { data: Mesh; series?: number[] }) {
  const nodes = data.nodes ?? []
  const links = data.links ?? []
  if (nodes.length === 0) return <div className="v3-we-mesh__empty">no nodes</div>

  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rx = maxX - minX || 1
  const ry = maxY - minY || 1
  const px = (x: number) => PAD + ((x - minX) / rx) * (W - 2 * PAD)
  const py = (y: number) => PAD + ((maxY - y) / ry) * (H - 2 * PAD) // flip: +y up

  const pos: Record<string, { x: number; y: number }> = {}
  for (const n of nodes) pos[n.id] = { x: px(n.x), y: py(n.y) }

  const rssis = links.map((l) => l.rssi).filter((r) => typeof r === "number")
  const mean = rssis.length ? rssis.reduce((a, b) => a + b, 0) / rssis.length : 0
  const best = rssis.length ? Math.max(...rssis) : 0
  const worst = rssis.length ? Math.min(...rssis) : 0
  const clusters = Array.from(new Set(nodes.map((n) => n.cluster).filter(Boolean))) as string[]

  // strong links last → drawn on top
  const ordered = [...links].sort((a, b) => a.rssi - b.rssi)

  return (
    <div className="v3-we-mesh">
      <svg className="v3-we-mesh__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="mesh RSSI graph">
        {ordered.map((l, i) => {
          const pa = pos[l.a], pb = pos[l.b]
          if (!pa || !pb) return null
          const s = strength(l.rssi)
          return (
            <line
              key={i}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={edgeColor(s)}
              strokeOpacity={0.1 + s * 0.6}
              strokeWidth={0.4 + s * 1.8}
            />
          )
        })}
        {nodes.map((n) => {
          const p = pos[n.id]
          const hue = clusterHue(n.cluster)
          return (
            <g key={n.id}>
              <circle cx={p.x} cy={p.y} r={5.5} fill={`hsl(${hue} 75% 58%)`} stroke="#0a0f15" strokeWidth={1.5} />
              <text x={p.x} y={p.y - 9} className="v3-we-mesh__lbl" textAnchor="middle">{n.id}</text>
            </g>
          )
        })}
      </svg>
      <div className="v3-we-mesh__meta">
        <span><b>{data.units ?? nodes.length}</b> nodes</span>
        <span><b>{links.length}</b> links</span>
        <span>mean <b>{mean.toFixed(0)}</b></span>
        <span>best <b>{best.toFixed(0)}</b></span>
        <span>worst <b>{worst.toFixed(0)}</b> dBm</span>
        {clusters.map((c) => (
          <span key={c} className="v3-we-mesh__cl">
            <i style={{ background: `hsl(${clusterHue(c)} 75% 58%)` }} aria-hidden /> {c}
          </span>
        ))}
      </div>
      {series && series.length > 1 ? (
        <div className="v3-we-mesh__trend">
          <RssiSpark series={series} />
          <span className="v3-we-mesh__trendk">mean rssi, last {series.length}</span>
        </div>
      ) : null}
    </div>
  )
}
