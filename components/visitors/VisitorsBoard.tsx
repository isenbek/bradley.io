"use client"

import { useEffect, useMemo, useState } from "react"
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo"
import { feature } from "topojson-client"
import type { FeatureCollection } from "geojson"
import topo from "world-atlas/countries-110m.json"
import { ShieldAlert, Bug, Users, Radio, Wifi, Cpu } from "lucide-react"

/* ---------------------------------------------------------------- types -- */
type Place = {
  net?: string; city: string | null; region?: string | null
  country: string | null; cc: string | null
  lat: number | null; lon: number | null
  asn: number | null; org: string | null
  hits: number; last?: number; ips?: number
}
type Scanner = Place & { ip: string; target: string | null }
type Snap = {
  generated: number; windowDays: number
  privacy: { humans: string; automated: string }
  sources: Record<string, { ok?: boolean; rows?: number; error?: string | null }>
  funnel: { edgeDropped: number; trapped: number; botsServed: number; humanHits: number; sessions: number }
  visitors: {
    sessions: number; uniqueNets: number; uniqueIpsSeen: number; pageviews: number; selfHits: number
    byDay: { d: string; humans: number; bots: number }[]
    byHourUtc: number[]
    places: Place[]
    countries: { cc: string; hits: number }[]
    asns: { asn: number; org: string | null; hits: number }[]
    topPaths: { path: string; hits: number }[]
    referrers: { ref: string; hits: number }[]
  }
  scanners: {
    hits: number; uniqueIps: number
    byDay: { d: string; hits: number }[]
    top: Scanner[]; places: Place[]
    paths: { path: string; hits: number }[]
  }
  edge: {
    ok: boolean; error?: string | null; blocklistIps: number | null; sets: number | null
    allowNets: number | null; feeds: { name: string; pkts: number }[]
    flood: { name: string; pkts: number }[]
  }
  planned: Record<string, { status: string; note: string }>
}

const nf = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString())

/* ------------------------------------------------------------------ map -- */
const WORLD = feature(
  topo as never,
  (topo as unknown as { objects: { countries: unknown } }).objects.countries as never
) as unknown as FeatureCollection

function WorldMap({ humans, scanners }: { humans: Place[]; scanners: Place[] }) {
  const [layer, setLayer] = useState<"both" | "humans" | "scanners">("both")
  const W = 980
  const H = 470

  const { land, grat } = useMemo(() => {
    const proj = geoNaturalEarth1().fitExtent(
      [[6, 6], [W - 6, H - 6]],
      { type: "Sphere" } as never
    )
    const p = geoPath(proj)
    return {
      land: WORLD.features.map((f) => p(f as never)).filter(Boolean) as string[],
      grat: p(geoGraticule10()) ?? "",
      proj,
    }
  }, [])

  const project = useMemo(() => {
    const proj = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" } as never)
    return (lon: number, lat: number) => proj([lon, lat])
  }, [])

  const dots = (rows: Place[], max: number) =>
    rows
      .filter((r) => r.lat != null && r.lon != null)
      .map((r, i) => {
        const xy = project(r.lon as number, r.lat as number)
        if (!xy) return null
        const rad = 2 + Math.sqrt(r.hits / max) * 9
        return { key: `${r.net ?? r.cc}-${i}`, x: xy[0], y: xy[1], r: rad, d: r }
      })
      .filter(Boolean) as { key: string; x: number; y: number; r: number; d: Place }[]

  const hMax = Math.max(1, ...humans.map((h) => h.hits))
  const sMax = Math.max(1, ...scanners.map((s) => s.hits))
  const hDots = useMemo(() => dots(humans, hMax), [humans]) // eslint-disable-line react-hooks/exhaustive-deps
  const sDots = useMemo(() => dots(scanners, sMax), [scanners]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="v3-vis-map">
      <div className="v3-vis-map__head">
        <div className="v3-vis-seg">
          {(["both", "humans", "scanners"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={`v3-vis-seg__btn${layer === k ? " is-on" : ""}`}
              onClick={() => setLayer(k)}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="v3-vis-map__key">
          <span><i className="v3-vis-dot v3-vis-dot--h" /> visitor networks ({humans.length})</span>
          <span><i className="v3-vis-dot v3-vis-dot--s" /> scanner origins ({scanners.length})</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="v3-vis-map__svg" role="img"
           aria-label="World map of visitor networks and scanner origins">
        <path d={grat} className="v3-vis-grat" />
        {land.map((d, i) => (
          <path key={i} d={d} className="v3-vis-land" />
        ))}
        {layer !== "humans" &&
          sDots.map((p) => (
            <circle key={`s${p.key}`} cx={p.x} cy={p.y} r={p.r} className="v3-vis-pt v3-vis-pt--s">
              <title>{`${p.d.city ?? "?"}, ${p.d.country ?? "?"} — ${nf(p.d.hits)} probes from ${nf(p.d.ips)} IPs`}</title>
            </circle>
          ))}
        {layer !== "scanners" &&
          hDots.map((p) => (
            <circle key={`h${p.key}`} cx={p.x} cy={p.y} r={p.r} className="v3-vis-pt v3-vis-pt--h">
              <title>{`${p.d.city ?? "?"}, ${p.d.region ?? p.d.country ?? "?"} — ${nf(p.d.hits)} hits · ${p.d.org ?? "unknown network"}`}</title>
            </circle>
          ))}
      </svg>
    </div>
  )
}

/* -------------------------------------------------------------- helpers -- */
function Bars({ rows, colorClass }: { rows: { label: string; n: number; sub?: string }[]; colorClass: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <div className="v3-vis-bars">
      {rows.map((r) => (
        <div key={r.label} className="v3-vis-bar">
          <span className="v3-vis-bar__lbl" title={r.label}>{r.label}</span>
          <span className="v3-vis-bar__track">
            <span className={`v3-vis-bar__fill ${colorClass}`} style={{ width: `${(r.n / max) * 100}%` }} />
          </span>
          <span className="v3-vis-bar__n">{nf(r.n)}</span>
          {r.sub ? <span className="v3-vis-bar__sub">{r.sub}</span> : null}
        </div>
      ))}
    </div>
  )
}

function DayChart({ days }: { days: { d: string; humans: number; bots: number; trapped: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.humans + d.bots))
  return (
    <div className="v3-vis-days">
      {days.map((d) => (
        <div key={d.d} className="v3-vis-day" title={`${d.d} · ${d.humans} human, ${d.bots} bot, ${d.trapped} trapped`}>
          <span className="v3-vis-day__stack">
            <span className="v3-vis-day__bot" style={{ height: `${(d.bots / max) * 100}%` }} />
            <span className="v3-vis-day__human" style={{ height: `${(d.humans / max) * 100}%` }} />
          </span>
          <span className="v3-vis-day__d">{d.d.slice(8)}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ page -- */
export function VisitorsBoard() {
  const [s, setS] = useState<Snap | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    const load = async () => {
      try {
        const r = await fetch("/api/visitors")
        if (!r.ok) throw new Error(r.status === 503 ? "collector-offline" : `http ${r.status}`)
        const j = await r.json()
        if (live) { setS(j); setErr(null) }
      } catch (e) {
        if (live) setErr(e instanceof Error ? e.message : "failed")
      }
    }
    load()
    const id = setInterval(load, 120_000)
    return () => { live = false; clearInterval(id) }
  }, [])

  if (err) {
    return (
      <div className="v3-panel v3-vis-offline">
        <strong>Aggregator offline.</strong>
        <p>
          {err === "collector-offline"
            ? "The snapshot has not been written yet. Run scripts/visitors_collector.py, or check the visitors-collector timer."
            : `Could not reach /api/visitors (${err}).`}
        </p>
      </div>
    )
  }
  if (!s) return <div className="v3-vis-loading">reading the logs…</div>

  const f = s.funnel
  const trappedByDay = Object.fromEntries(s.scanners.byDay.map((d) => [d.d, d.hits]))
  const days = s.visitors.byDay.map((d) => ({ ...d, trapped: trappedByDay[d.d] ?? 0 }))
  const floodTotal = s.edge.flood.reduce((n, x) => n + x.pkts, 0)

  const TIERS = [
    { k: "edge", Icon: ShieldAlert, label: "Dropped at the edge", n: f.edgeDropped,
      sub: `${nf(s.edge.blocklistIps)} addresses on ${nf(s.edge.sets)} feeds`, cls: "v3-vis-tier--red" },
    { k: "trap", Icon: Bug, label: "Trapped at the door", n: f.trapped,
      sub: `${nf(s.scanners.uniqueIps)} distinct probers, all 444'd`, cls: "v3-vis-tier--amber" },
    { k: "bots", Icon: Radio, label: "Bots served", n: f.botsServed,
      sub: "crawlers and agents that got a real response", cls: "v3-vis-tier--slate" },
    { k: "human", Icon: Users, label: "People", n: f.sessions,
      sub: `${nf(s.visitors.uniqueNets)} networks · ${nf(s.visitors.pageviews)} pageviews`, cls: "v3-vis-tier--blue" },
  ]

  return (
    <>
      {/* FUNNEL */}
      <div className="v3-vis-tiers">
        {TIERS.map((t) => (
          <div key={t.k} className={`v3-vis-tier ${t.cls}`}>
            <span className="v3-vis-tier__ico"><t.Icon size={17} strokeWidth={2.3} /></span>
            <span className="v3-vis-tier__n">{nf(t.n)}</span>
            <span className="v3-vis-tier__lbl">{t.label}</span>
            <span className="v3-vis-tier__sub">{t.sub}</span>
          </div>
        ))}
      </div>

      <WorldMap humans={s.visitors.places} scanners={s.scanners.places} />

      {/* VISITORS */}
      <div className="v3-vis-grid">
        <section className="v3-panel">
          <div className="v3-cardhead">
            <h3>Traffic by day</h3>
            <span className="v3-cardhead__meta">{s.windowDays}-day window · blue people, grey bots</span>
          </div>
          <DayChart days={days} />
        </section>

        <section className="v3-panel">
          <div className="v3-cardhead">
            <h3>Where people are</h3>
            <span className="v3-cardhead__meta">by /24 network</span>
          </div>
          <Bars
            colorClass="is-blue"
            rows={s.visitors.places.slice(0, 12).map((p) => ({
              label: [p.city, p.region ?? p.country].filter(Boolean).join(", ") || p.net || "unknown",
              n: p.hits,
              sub: p.org ?? undefined,
            }))}
          />
        </section>

        <section className="v3-panel">
          <div className="v3-cardhead">
            <h3>Networks</h3>
            <span className="v3-cardhead__meta">autonomous systems</span>
          </div>
          <Bars
            colorClass="is-blue"
            rows={s.visitors.asns.slice(0, 12).map((a) => ({
              label: a.org ?? `AS${a.asn}`, n: a.hits, sub: `AS${a.asn}`,
            }))}
          />
        </section>

        <section className="v3-panel">
          <div className="v3-cardhead">
            <h3>Most-read pages</h3>
            <span className="v3-cardhead__meta">humans only, assets and API excluded</span>
          </div>
          <Bars colorClass="is-blue" rows={s.visitors.topPaths.slice(0, 12).map((p) => ({ label: p.path, n: p.hits }))} />
        </section>
      </div>

      {/* SCANNERS */}
      <section className="v3-panel v3-vis-wall">
        <div className="v3-cardhead">
          <h3>The scanner wall</h3>
          <span className="v3-cardhead__meta">
            {nf(s.scanners.hits)} probes · {nf(s.scanners.uniqueIps)} hosts · every one dropped with a 444
          </span>
        </div>
        <div className="v3-vis-wall__grid">
          <div>
            <h4>Busiest probers</h4>
            <table className="v3-vis-tbl">
              <thead>
                <tr><th>address</th><th>origin</th><th>network</th><th className="num">probes</th></tr>
              </thead>
              <tbody>
                {s.scanners.top.slice(0, 14).map((x) => (
                  <tr key={x.ip}>
                    <td className="mono">{x.ip}</td>
                    <td>{[x.city, x.cc].filter(Boolean).join(", ") || "—"}</td>
                    <td className="dim">{x.org ?? "—"}</td>
                    <td className="num">{nf(x.hits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h4>What they came looking for</h4>
            <Bars
              colorClass="is-coral"
              rows={s.scanners.paths.slice(0, 14).map((p) => ({ label: p.path, n: p.hits }))}
            />
          </div>
        </div>
      </section>

      {/* EDGE */}
      <section className="v3-panel">
        <div className="v3-cardhead">
          <h3>The edge</h3>
          <span className="v3-cardhead__meta">
            {s.edge.ok
              ? `banIP on spydr · ${nf(s.edge.blocklistIps)} addresses · ${nf(s.edge.allowNets)} allowlisted nets`
              : `unreachable — ${s.edge.error ?? "no reading"}`}
          </span>
        </div>
        {s.edge.ok ? (
          <div className="v3-vis-wall__grid">
            <div>
              <h4>Threat-feed drops</h4>
              <Bars colorClass="is-red" rows={s.edge.feeds.map((x) => ({ label: x.name, n: x.pkts }))} />
              <p className="v3-vis-note">
                Packets killed on the router before they ever reached this server. Counters only:
                per-packet drop logging is deliberately off, it once pegged the EA7500 to 1–2s RTT.
              </p>
            </div>
            <div>
              <h4>Flood limiter</h4>
              <Bars colorClass="is-red" rows={s.edge.flood.map((x) => ({ label: x.name, n: x.pkts }))} />
              <p className="v3-vis-note">
                {nf(floodTotal)} packets rate-limited. Mostly a local sensor shouting on UDP, not an attack.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* PLANNED */}
      <section className="v3-panel v3-vis-planned">
        <div className="v3-cardhead">
          <h3>Not wired yet</h3>
          <span className="v3-cardhead__meta">sketched, so the shape is visible before the plumbing exists</span>
        </div>
        <div className="v3-vis-planned__grid">
          {[
            { Icon: ShieldAlert, t: "WAN port knocks", k: "wanScans" },
            { Icon: Wifi, t: "The 17.x WireGuard + TOR fleet", k: "fleet" },
            { Icon: Cpu, t: "OpenWrt control interface", k: "mcp" },
          ].map(({ Icon, t, k }) => (
            <div key={k} className="v3-vis-plan">
              <span className="v3-vis-plan__head">
                <Icon size={15} strokeWidth={2.3} /> {t}
                <span className="v3-vis-plan__tag">planned</span>
              </span>
              <p>{s.planned[k]?.note}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="v3-vis-foot">
        Window {s.windowDays} days · snapshot {new Date(s.generated * 1000).toISOString().replace("T", " ").slice(0, 16)} UTC
        · {nf(s.sources.access?.rows)} access rows, {nf(s.sources.scanner?.rows)} trap rows
        · {nf(s.visitors.selfHits)} of my own hits excluded
      </p>
    </>
  )
}
