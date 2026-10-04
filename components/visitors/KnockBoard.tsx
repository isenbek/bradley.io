"use client"

import { useEffect, useMemo, useState } from "react"
import { RowChart, HeatGrid, RampKey } from "@/app/_charts"
import { FAMILY } from "@/components/kit/family-data"
import {
  InstrumentHead,
  InstrumentNote,
  InstrumentStatus,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"

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
  /** Absent from snapshots written before 2026-10-04. */
  family?: Family
}

interface Family {
  note: string
  members: {
    site: string
    reads: number
    visits: number
    byDay: { d: string; reads: number }[]
    from: { host: string; reads: number }[]
  }[]
  doors: { from: string; to: string; reads: number }[]
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
const REFRESH_MS = 300_000

export function KnockBoard() {
  const [s, setS] = useState<Snapshot | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [site, setSite] = useState<string>(ALL)

  useEffect(() => {
    let live = true
    // Asked again every five minutes (the collector writes every ten), so a
    // page left open follows the snapshot, and a collector that was down when
    // the page loaded is picked up when it returns without a reload.
    const load = () =>
      fetch("/api/visitors")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((d) => {
          if (!live) return
          setS(d)
          setErr(null)
        })
        .catch((e) => live && setErr(String(e.message ?? e)))
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      live = false
      clearInterval(id)
    }
  }, [])

  const view: Bucket | null = useMemo(() => {
    if (!s) return null
    if (site === ALL) return s.visitors
    return s.sites.find((x) => x.site === site) ?? s.visitors
  }, [s, site])

  // The snapshot says when it was built. A timer rewrites it every ten minutes,
  // so an old `generated` means the collector stopped, and every count on this
  // page is then that old without looking it.
  const inst = useInstrument("visitors", {
    lastHeard: s?.generated,
    error: err !== null,
    pending: !s && err === null,
    tickMs: 30_000,
  })
  const notLive = inst.reading !== null && inst.reading.state !== "live"

  // A missing snapshot is a collector that is offline, which is ATTENTION and
  // orange. It was a red notice, and red here means an assertion failed.
  if (!s || !view) {
    return (
      <InstrumentHead name="Collector" status={inst}>
        {err ? (
          <InstrumentNote>
            <b>The collector&apos;s snapshot cannot be read.</b> ({err}.) It is written every ten
            minutes by a systemd timer, and this page reads it rather than the logs, so an error
            here means the writer stopped, not that nobody visited. This page asks again every
            five minutes and resumes by itself.
          </InstrumentNote>
        ) : (
          <InstrumentNote>Reading the logs.</InstrumentNote>
        )}
      </InstrumentHead>
    )
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
          <div className="panel-bar beta-inst-bar">
            <b>Whole host</b>
            <span className="beta-inst-tags">
              <InstrumentStatus status={inst} />
              <span>{s.windowDays} days</span>
            </span>
          </div>
          {notLive && (
            <InstrumentNote>
              {err ? (
                <>
                  <b>The snapshot could not be re-read just now.</b> The figures below are from the
                  last one this page received, built{" "}
                </>
              ) : (
                <>
                  <b>This snapshot is old.</b> The collector normally rewrites it every ten
                  minutes, and this one was built{" "}
                </>
              )}
              <When at={s.generated} now={inst.now} />. Every figure on this page is as of then.
              This page asks again every five minutes.
            </InstrumentNote>
          )}
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

      {s.family && <FamilyPanel f={s.family} windowDays={s.windowDays} />}

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

/** "2026-10-03" as "3 Oct", sliced from the string so no timezone moves it. */
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const shortDay = (iso: string) => `${Number(iso.slice(8, 10))} ${MON[Number(iso.slice(5, 7)) - 1] ?? ""}`

/**
 * The family: meatball.ai and its sites, side by side, and the doors between
 * them (docket item 7, 2026-10-04).
 *
 * Its numbers are the collector's "family" section: human page reads only
 * (no bots, assets, API calls or prefetches), visits split by a 30-minute
 * gap, outside referrers by host name only. A door is a read on one family
 * site whose referrer is another; it is countable because links into the
 * family keep their origin (lib/external-rel.ts). Nothing here comes from a
 * cookie, a pixel or a script: it is nginx's own logs.
 *
 * "Since" is the first day a site has any reads in the window, so a site
 * that has only existed for two days says so instead of looking quiet next
 * to one with a month of history. Each site wears its family dot, the one
 * identity colour the family shares; the numbers stay in ink.
 */
function FamilyPanel({ f, windowDays }: { f: Family; windowDays: number }) {
  const hueOf = (site: string) => FAMILY.find((m) => m.href && new URL(m.href).hostname === site)?.hue
  const crossings = f.doors.reduce((n, d) => n + d.reads, 0)
  return (
    <>
      <div className="prose beta-sec">
        <h2>The family</h2>
        <p>
          Meatball Labs and its sites, side by side, over the same {`${windowDays} days`}: pages people
          read, the visits they came in, and how often someone walked through a door from one
          family site to another. Taken from the server&apos;s own logs, with no cookie, pixel or
          script on any of the sites.
        </p>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="The family, by site">
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th className="num">Pages read</th>
                <th className="num">Visits</th>
                <th>Since</th>
                <th>Most readers from</th>
              </tr>
            </thead>
            <tbody>
              {f.members.map((m) => {
                const hue = hueOf(m.site)
                const top = m.from[0]
                return (
                  <tr key={m.site}>
                    <td className="name">
                      <span className="beta-fam-site">
                        {hue && <span className="family-dot" data-hue={hue} aria-hidden="true" />}
                        {m.site}
                      </span>
                    </td>
                    <td className="num">{nf(m.reads)}</td>
                    <td className="num">{nf(m.visits)}</td>
                    <td>{m.byDay[0] ? shortDay(m.byDay[0].d) : "no reads"}</td>
                    <td>{top ? `${top.host} (${nf(top.reads)})` : "no outside referrers"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* A table, not a bar chart: a door is two site names, and the chart's
          label column cut them to "bradley.io → t…". */}
      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Doors between family sites">
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th className="num">Crossings</th>
              </tr>
            </thead>
            <tbody>
              {f.doors.length ? (
                f.doors.map((d) => (
                  <tr key={`${d.from}>${d.to}`}>
                    <td className="name">{d.from}</td>
                    <td className="name">{d.to}</td>
                    <td className="num">{nf(d.reads)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No crossings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>
              {nf(crossings)} {crossings === 1 ? "crossing" : "crossings"}, counted on the receiving
              site from the origin a browser sends with a cross-site click. The doors opened on 4
              October 2026, so this is mostly ahead.
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
