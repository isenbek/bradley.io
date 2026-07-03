// Decoder for `ble.device_census` — the Bluetooth-LE environment as seen by the
// sensor fleet over a rolling window. Hero = resolved devices; a vitals grid
// carries the census aggregates (rotating private addresses, coverage,
// infrastructure); an anchors list ranks the most-observed radios, each with a
// node-reach badge, colored RSSI, and an observation-count bar.

type Anchor = { addr?: string; nodes?: number; rssi?: number; obs?: number }
type Census = {
  window_s?: number
  nodes?: number // sensor nodes reporting
  rpas?: number // rotating private addresses seen
  devices?: number // resolved devices
  collapse?: number // rpas → devices collapse ratio
  multi_node_frac?: number // fraction of devices seen by >1 node
  public_infra?: number // fixed/public-infrastructure beacons
  anchors?: Anchor[]
}

// RSSI → 0..1 strength (~-90 dBm weak … ~-30 dBm strong), then red→amber→green.
// Mirrors the mesh + skyplot palette so signal reads the same across the board.
function strength(rssi: number): number {
  return Math.max(0, Math.min(1, (rssi - -90) / (-30 - -90)))
}
function rssiColor(rssi: number): string {
  return `hsl(${Math.round(strength(rssi) * 130)} 72% 58%)`
}

function fmtWindow(s?: number): string {
  if (!s) return "—"
  if (s >= 3600) return `${(s / 3600).toFixed(s % 3600 ? 1 : 0)}h`
  if (s >= 60) return `${Math.round(s / 60)}m`
  return `${s}s`
}
function fmtInt(n?: number): string {
  return typeof n === "number" ? n.toLocaleString("en-US") : "—"
}

export function BleDeviceCensus({ data }: { data: Census }) {
  const anchors = (data.anchors ?? [])
    .filter((a) => typeof a.obs === "number")
    .sort((a, b) => (b.obs ?? 0) - (a.obs ?? 0))
    .slice(0, 6)
  const maxObs = Math.max(1, ...anchors.map((a) => a.obs ?? 0))
  const nodes = data.nodes ?? 0
  const mnPct = data.multi_node_frac != null ? Math.round(data.multi_node_frac * 100) : null

  return (
    <div className="v3-we-vitals">
      <div className="v3-we-vitals__hero">
        <span className="v3-we-vitals__lamp is-ok" aria-hidden />
        <div>
          <span className="v3-we-vitals__big">{fmtInt(data.devices)}</span>
          <span className="v3-we-vitals__k">resolved devices</span>
        </div>
        <span className="v3-we-vitals__tag">
          {nodes} node{nodes === 1 ? "" : "s"}
        </span>
      </div>

      <dl className="v3-we-kv">
        <div><dt>addresses</dt><dd>{fmtInt(data.rpas)}</dd></div>
        <div><dt>multi-node</dt><dd>{mnPct != null ? `${mnPct}%` : "—"}</dd></div>
        <div><dt>collapse</dt><dd>{data.collapse != null ? `${data.collapse.toFixed(2)}×` : "—"}</dd></div>
        <div><dt>public infra</dt><dd>{fmtInt(data.public_infra)}</dd></div>
        <div><dt>window</dt><dd>{fmtWindow(data.window_s)}</dd></div>
        <div><dt>anchors</dt><dd>{fmtInt(data.anchors?.length)}</dd></div>
      </dl>

      {anchors.length ? (
        <ul className="v3-we-ble__anchors">
          {anchors.map((a, i) => (
            <li key={a.addr ?? i} className="v3-we-ble__row">
              <span className="v3-we-ble__addr">{a.addr ?? "—"}</span>
              <span className="v3-we-ble__nodes">{a.nodes ?? 0}× nodes</span>
              <span className="v3-we-ble__rssi" style={{ color: a.rssi != null ? rssiColor(a.rssi) : undefined }}>
                {a.rssi != null ? `${a.rssi.toFixed(0)} dBm` : "—"}
              </span>
              <span className="v3-we-ble__bar" aria-hidden>
                <span style={{ width: `${Math.round(((a.obs ?? 0) / maxObs) * 100)}%` }} />
              </span>
              <span className="v3-we-ble__obs">{fmtInt(a.obs)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
