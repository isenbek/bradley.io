"use client"

import { useEffect, useMemo, useState } from "react"
import { RowChart, HeatGrid, RampKey } from "@/app/_charts"

/**
 * Who knocked, on the style kit.
 *
 * Everything here is machine output, so it is all on panel. The only paper on
 * the page is the prose in app/visitors/page.tsx.
 *
 * The site selector is the new part. The collector now walks every nginx vhost
 * on the box rather than bradley.io alone, so this shows the aggregate across
 * all of them by default and lets you narrow to one. Sessions and unique
 * networks deliberately do NOT sum across sites: one person reading two of them
 * is one aggregate session and one /24, counted once there and once in each.
 */

interface Place {
  net: string
  city: string | null
  region: string | null
  country: string | null
  cc: string | null
  asn: number | null
  org: string | null
  hits: number
  reads: number
  sessions: number
  last: number
}

interface Bucket {
  sessions: number
  uniqueNets: number
  uniqueIpsSeen: number
  pageviews: number
  prefetches: number
  botHits?: number
  selfHits: number
  byDay: { d: string; humans: number; bots: number }[]
  byHourUtc: number[]
  places: Place[]
  countries: { cc: string; hits: number }[]
  asns: { asn: number; org: string | null; hits: number }[]
  topPaths: { path: string; hits: number }[]
  referrers: { ref: string; hits: number }[]
  statuses: Record<string, number>
}

interface SiteBucket extends Bucket {
  site: string
  rows: number
}

interface Snapshot {
  generated: number
  windowDays: number
  tookMs: number
  sources: {
    access: { sites: number; rows: number; files: number; perSite: { site: string; rows: number }[] }
    scanner: { rows: number; files: number }
    edge: { ok: boolean; host: string; error: string | null }
  }
  funnel: {
    edgeDropped: number
    trapped: number
    botsServed: number
    humanHits: number
    sessions: number
  }
  visitors: Bucket
  sites: SiteBucket[]
  sitesFolded: { site: string; rows: number; reads: number }[]
  scanners: {
    hits: number
    uniqueIps: number
    byDay: { d: string; hits: number }[]
    top: {
      ip: string
      hits: number
      last: number
      target: string | null
      city: string | null
      country: string | null
      org: string | null
    }[]
    paths: { path: string; hits: number }[]
  }
  edge: { ok: boolean; feeds?: { name: string; pkts: number }[] }
}

const nf = (n: number | undefined) => (n ?? 0).toLocaleString()

const ago = (epoch: number) => {
  const s = Math.max(0, Date.now() / 1000 - epoch)
  if (s < 90) return "just now"
  if (s < 5400) return `${Math.round(s / 60)}m ago`
  if (s < 172800) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

const ALL = "__all__"

export function KnockBoard() {
  const [s, setS] = useState<Snapshot | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [site, setSite] = useState<string>(ALL)

  useEffect(() => {
    let live = true
    fetch("/api/visitors")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => live && setS(d))
      .catch((e) => live && setErr(String(e.message ?? e)))
    return () => {
      live = false
    }
  }, [])

  const view: Bucket | null = useMemo(() => {
    if (!s) return null
    if (site === ALL) return s.visitors
    return s.sites.find((x) => x.site === site) ?? s.visitors
  }, [s, site])

  if (err) {
    return (
      <div className="notice fail">
        <b>The collector is not answering.</b> {err}. The snapshot is written every ten minutes by
        a systemd timer; this reads it rather than the logs, so an error here means the writer
        stopped, not that nobody visited.
      </div>
    )
  }

  if (!s || !view) {
    return <p className="quiet">reading the logs…</p>
  }

  const isAll = site === ALL
  const days = view.byDay.map((d) => ({ label: d.d.slice(5), value: d.humans }))
  const hours = view.byHourUtc.map((n, i) => ({
    label: `${String(i).padStart(2, "0")}:00`,
    value: n,
  }))
  const paths = view.topPaths
    .slice(0, 12)
    .map((p) => ({ label: p.path, value: p.hits, display: nf(p.hits) }))
  // Label by city when GeoLite knows one, otherwise by the /24 itself. Falling
  // back to the country code alone produced six rows all reading "US": not just
  // uninformative but duplicate keys, since the chart keys rows by label. The
  // network is always distinct and is the finest thing kept anyway.
  const nets = view.places
    .slice(0, 12)
    .map((p) => ({
      label: p.city ? [p.city, p.cc].filter(Boolean).join(", ") : p.net,
      value: p.reads || p.hits,
      display: nf(p.reads || p.hits),
    }))
  const orgs = view.asns
    .slice(0, 10)
    .map((a) => ({ label: a.org ?? `AS${a.asn}`, value: a.hits, display: nf(a.hits) }))

  return (
    <>
      {/* THE FUNNEL — always the aggregate: the edge and the scanner trap
          cannot be attributed to a site (see below), so narrowing would show
          three site numbers next to two whole-host ones. */}
      <div className="prose beta-sec">
        <h2>The funnel</h2>
        <p>
          Four tiers, widest first, over the last {s.windowDays} days across all{" "}
          {s.sources.access.sites} sites this host serves.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Whole host</b>
            <span>{s.windowDays} days</span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Dropped at the edge</td>
                <td className="num">{nf(s.funnel.edgeDropped)}</td>
              </tr>
              <tr>
                <td>Trapped at the door</td>
                <td className="num">{nf(s.funnel.trapped)}</td>
              </tr>
              <tr>
                <td>Bots served</td>
                <td className="num">{nf(s.funnel.botsServed)}</td>
              </tr>
              <tr>
                <td>Human requests</td>
                <td className="num">{nf(s.funnel.humanHits)}</td>
              </tr>
              <tr>
                <td>
                  <b>Sessions</b>
                </td>
                <td className="num">
                  <b>{nf(s.funnel.sessions)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* THE SITE SELECTOR */}
      <div className="prose beta-sec">
        <h2>By site</h2>
        <p>
          {s.sites.length} sites with enough traffic to stand on their own. Sessions and networks
          do not sum to the aggregate: one person reading two sites is one visitor here and one on
          each of them.
        </p>
      </div>

      {/* aria-pressed, not role="tab": the kit's chip is a toggle and styles
          its active state off [aria-pressed="true"]. Claiming the tab role
          without tabpanel ids and arrow-key navigation would be a worse lie to
          a screen reader than a plain group of toggles, which is what this is. */}
      <div className="chips" role="group" aria-label="Filter by site">
        <button
          type="button"
          className="chip"
          aria-pressed={isAll}
          onClick={() => setSite(ALL)}
        >
          All sites
        </button>
        {s.sites.map((x) => (
          <button
            type="button"
            className="chip"
            key={x.site}
            aria-pressed={site === x.site}
            onClick={() => setSite(x.site)}
          >
            {x.site}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>{isAll ? "All sites" : site}</b>
            <span>{isAll ? `${s.sources.access.sites} vhosts` : "one vhost"}</span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Sessions</td>
                <td className="num">{nf(view.sessions)}</td>
              </tr>
              <tr>
                <td>Pages read</td>
                <td className="num">{nf(view.pageviews)}</td>
              </tr>
              <tr>
                <td>Distinct networks</td>
                <td className="num">{nf(view.uniqueNets)}</td>
              </tr>
              <tr>
                <td>Bot requests</td>
                <td className="num">{nf(view.botHits)}</td>
              </tr>
              <tr>
                <td>Prefetches not counted as reads</td>
                <td className="num">{nf(view.prefetches)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <RampKey low="quieter" high="busier" />

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Human requests per day</b>
            <span>{isAll ? "all sites" : site}</span>
          </div>
          <HeatGrid caption={`${days.length} days`} data={days} emptyNote="No days recorded." />
        </div>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>By hour</b>
            <span>UTC</span>
          </div>
          <HeatGrid caption="Requests per hour of day" data={hours} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Where people are</b>
            <span>top {nets.length} of {nf(view.uniqueNets)}</span>
          </div>
          <RowChart caption="Pages read per place" data={nets} emptyNote="No places geolocated." />
          <p className="beta-chart__note">
            One row per /24 network, labelled by city. That is the finest resolution kept.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Networks</b>
            <span>by operator</span>
          </div>
          <RowChart caption="Requests per network operator" data={orgs} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Most-read pages</b>
            <span>{isAll ? "all sites" : site}</span>
          </div>
          <RowChart caption="Reads per path" data={paths} emptyNote="No pages read." />
        </div>
      </div>

      {/* SCANNERS — whole host, and the page has to say why. */}
      <div className="prose beta-sec">
        <h2>The scanner wall</h2>
        <p>
          {nf(s.scanners.hits)} probes from {nf(s.scanners.uniqueIps)} addresses, killed before
          they got a response.
        </p>
      </div>

      <div className="notice">
        <b>Scanners cannot be split by site.</b> nginx writes the trap to one shared log in the
        combined format, which carries no vhost field, so a probe knows what it asked for but not
        which door it knocked on. This tier is whole-host whatever is selected above.
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Busiest scanners">
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th className="num">Probes</th>
                <th>Looking for</th>
                <th>Where</th>
                <th>Last</th>
              </tr>
            </thead>
            <tbody>
              {s.scanners.top.slice(0, 25).map((x) => (
                <tr key={x.ip}>
                  <td className="name">{x.ip}</td>
                  <td className="num">{nf(x.hits)}</td>
                  <td>{x.target ?? "-"}</td>
                  <td>{[x.city, x.country].filter(Boolean).join(", ") || "unknown"}</td>
                  <td>{ago(x.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>
              {Math.min(25, s.scanners.top.length)} of {nf(s.scanners.uniqueIps)} shown
            </span>
          </div>
        </div>
      </div>

      <p className="measured">
        <b>visitors.json</b>, {s.sources.access.rows.toLocaleString()} access rows from{" "}
        {s.sources.access.sites} sites plus {nf(s.sources.scanner.rows)} trap rows, built in{" "}
        {(s.tookMs / 1000).toFixed(1)}s, {ago(s.generated)}
      </p>

      {s.sitesFolded.length > 0 && (
        <p className="quiet">
          Folded into the aggregate without a tab, for too few reads to be worth one:{" "}
          {s.sitesFolded.map((f) => `${f.site} (${f.reads})`).join(", ")}.
        </p>
      )}
    </>
  )
}
