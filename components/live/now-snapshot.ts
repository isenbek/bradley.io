/**
 * "Running now": one honest line per instrument, assembled on the server.
 *
 * SERVER ONLY. This file reads the disk and calls the site's own API route
 * handlers; a client component must import types from ./types and nothing
 * from here.
 *
 * EXPORTS
 *   getNow(): Promise<NowSnapshot>
 *     The full answer, every instrument asked. Cached in memory for 10 s, so a
 *     burst of visitors is one fan-out to the hardware, not one each. Waits at
 *     most ~2.5 s: an instrument that has not answered by then is reported as
 *     not answering, which is what it is. Never throws. This is /api/now.
 *
 *   peekNow(): Promise<NowSnapshot>
 *     The same answer WITHOUT waiting on the network, for a server component
 *     that must not hold a page render behind a dead Geiger box:
 *       const initial = await peekNow()
 *       <NowPanel initial={initial} />
 *     Files on this host (the pulse, the bus, the camera, the firewall, the
 *     build) are read fresh. The two network instruments (Geiger, fleet)
 *     come from the last answer if it is under a minute old, and are
 *     otherwise reported as "checking" while a refresh starts in the
 *     background; the page's first client poll fills them in. Never throws.
 *     A checking row's sentence is in the past tense and about the snapshot
 *     ("had not yet asked ... when it assembled this answer"), because a page
 *     that caches its HTML serves that sentence long after it was written.
 *
 *   visitorsSummary(): Promise<VisitorsSummary | null>
 *     The 450 KB visitors snapshot reduced to the dozen numbers a front page
 *     can use. Null when the collector has never written. This is
 *     /api/visitors/summary.
 *
 * WHERE THE DATA COMES FROM. Nothing here knows an upstream URL or a file path
 * that a route already knows. Each instrument is read by calling the GET
 * handler of the route that already serves its board (app/api/trng,
 * app/api/worldevent, app/api/eyes/meta, app/api/visitors, app/api/fleet,
 * app/api/hotbits-probe), in process, with no HTTP hop. The two
 * things read directly are the two that have no route: lib/build-info.json and
 * the pulse file the cron writes into public/data.
 *
 * ONE CAVEAT ABOUT THE PROXIES' MEMORY. Each proxy keeps "when my upstream last
 * answered" and "since when I have been asking" in module scope, and reports
 * them in a failure body. A call made here reads and feeds the copy of that
 * module bundled with THIS file. In a production build that may or may not be
 * the copy /api/trng itself runs (the reason this file keeps its own cache on
 * globalThis, below), so the "has been asking since" time in a sentence here
 * can differ from the one the /trng board prints. Both are true floors on the
 * silence: each says since when its own copy has been asking. Checked equal on
 * the dev server only. After a deploy, compare /api/trng/health's
 * watching_since_iso with the time in /api/now's geiger sentence.
 */

import { promises as fs } from "fs"
import path from "path"
import { NextRequest } from "next/server"
import buildInfo from "@/lib/build-info.json"
import {
  absDate,
  absDateTime,
  readInstrument,
  toMs,
  type InstrumentKey,
} from "@/lib/instrument-status"
import { GET as trngGET } from "@/app/api/trng/[...path]/route"
import { GET as hotbitsProbeGET } from "@/app/api/hotbits-probe/route"
import { GET as worldeventGET } from "@/app/api/worldevent/route"
import { GET as eyesMetaGET } from "@/app/api/eyes/meta/route"
import { GET as visitorsGET } from "@/app/api/visitors/route"
import { GET as fleetGET } from "@/app/api/fleet/[...path]/route"
import { NOW_ORDER, type NowId, type NowRow, type NowSnapshot, type Pulse, type PulseBar } from "./types"

// ---- Timing ---------------------------------------------------------------

/** How long an assembled answer is served from memory. */
const SNAPSHOT_TTL_MS = 10_000
/** How long /api/now waits for a network instrument before saying so. */
const NETWORK_WAIT_MS = 2_500
/** How long anything waits for a file on this host. */
const LOCAL_WAIT_MS = 2_000
/** peekNow() will reuse a network answer this old rather than say "checking". */
const RECENT_MS = 60_000
/**
 * An instrument that failed its last completed attempt is known to be down,
 * and for this long nobody is made to wait the full 2.5 s on it again: the
 * retry still goes out every 10 s, it just is not waited for. When the box
 * comes back the retry lands and the next answer has it.
 */
const KNOWN_DOWN_MS = 300_000
const KNOWN_DOWN_WAIT_MS = 250
/** The visitors snapshot is rewritten every ten minutes; parse it once a minute. */
const VISITORS_TTL_MS = 60_000
/** The Geiger marker probe is a second request to the box. Once in five minutes. */
const PROBE_TTL_MS = 300_000
/** The Geiger monitor writes a metrics row every five minutes. Three missed is too old. */
const GEIGER_MONITOR_MAX_AGE_MS = 900_000

const MIN = 60_000
const HOUR = 3_600_000

// ---- The table of instruments ---------------------------------------------

/**
 * The pulse file's own row in FRESHNESS (lib/instrument-status.ts): late after
 * three missed cron runs, gone after fifteen. It borrowed the camera's row
 * until that table had one for it; the numbers did not change, only the name
 * the row is judged and reported under.
 */
const PULSE_FRESHNESS: InstrumentKey = "activity"

const META: Record<NowId, { label: string; href: string | null; freshness: InstrumentKey | null }> =
  {
    activity: { label: "Claude Code", href: "/ai-pilot", freshness: PULSE_FRESHNESS },
    firewall: { label: "Knock knock", href: "/visitors", freshness: "visitors" },
    geiger: { label: "Hotbits", href: "/trng", freshness: "geiger" },
    bus: { label: "Perception bus", href: "/dragonfli/worldevent", freshness: "worldevent" },
    cameras: { label: "Meatball eye", href: "/meatball", freshness: "camera" },
    fleet: { label: "Fleet", href: "/fleet", freshness: "fleet" },
    build: { label: "This build", href: null, freshness: null },
  }

// ---- Process memory -------------------------------------------------------
// On globalThis, not at module scope: the route and a page that calls
// peekNow() can be bundled separately, and a dev server reloads this module on
// every edit. Either way there must be one cache per process, or the 10 s
// promise ("a burst of visitors does not fan out to the hardware") is kept per
// bundle instead of per server.

interface Slot<T> {
  value: T | null
  /** When `value` was stored, epoch ms. 0 if never. */
  at: number
  inflight: Promise<void> | null
}

interface PulseTrack {
  generatedMs: number
  hourStartMs: number
  thisHour: number
  lastActiveMs: number | null
}

interface Memory {
  snapshot: NowSnapshot | null
  snapshotAt: number
  building: Promise<NowSnapshot> | null
  slots: Record<string, Slot<unknown>>
  /** The newest moment each instrument was heard by this process, epoch ms. */
  heard: Partial<Record<NowId, number>>
  track: PulseTrack | null
}

const g = globalThis as typeof globalThis & { __bradleyNow?: Memory }
const mem: Memory = (g.__bradleyNow ??= {
  snapshot: null,
  snapshotAt: 0,
  building: null,
  slots: {},
  heard: {},
  track: null,
})

function slot<T>(name: string): Slot<T> {
  return (mem.slots[name] ??= { value: null, at: 0, inflight: null }) as Slot<T>
}

interface Asked<T> {
  value: T | null
  /** When the value was read, epoch ms. 0 if there is none. */
  at: number
  /** The refresh this call wanted did not finish in time (or failed). */
  missed: boolean
}

/**
 * Read a source through its slot: serve the cached value inside its TTL,
 * otherwise start one refresh (never two) and wait for it at most `waitMs`.
 * A refresh that outlives the wait is not cancelled. It lands in the slot when
 * it lands and the next caller gets it; that is how a slow failure's "last
 * answered" memory still arrives. Never throws.
 */
async function ask<T>(
  name: string,
  read: () => Promise<T>,
  ttlMs: number,
  waitMs: number
): Promise<Asked<T>> {
  const s = slot<T>(name)
  const started = Date.now()
  if (s.at > 0 && started - s.at < ttlMs) return { value: s.value, at: s.at, missed: false }

  if (!s.inflight) {
    s.inflight = read()
      .then(
        (v) => {
          s.value = v
          s.at = Date.now()
        },
        () => {
          /* a source that throws is a source that did not answer */
        }
      )
      .finally(() => {
        s.inflight = null
      })
  }
  if (waitMs > 0) {
    let timer: ReturnType<typeof setTimeout> | undefined
    await Promise.race([
      s.inflight,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, waitMs)
      }),
    ])
    clearTimeout(timer)
  }
  return { value: s.value, at: s.at, missed: s.at < started }
}

/**
 * Can this probe be reported as it stands?
 *
 * Yes if it just completed. If the refresh was not waited out, a remembered
 * FAILURE still stands (the instrument was down a moment ago and has not
 * answered since), and a remembered ANSWER stands only for peekNow(), briefly.
 * To /api/now, an instrument that answered a minute ago and is silent for
 * 2.5 s now is not answering, and that is what it is told.
 */
function usable<T extends { answered: boolean }>(
  a: Asked<T>,
  peek: boolean,
  now: number
): a is Asked<T> & { value: T } {
  if (a.value == null) return false
  if (!a.missed) return true
  const age = now - a.at
  if (!a.value.answered) return age < KNOWN_DOWN_MS
  return peek && age < RECENT_MS
}

/** How long to wait on a network instrument, given what is already known. */
function networkWait(name: string, waitMs: number): number {
  const s = slot<{ answered: boolean }>(name)
  const knownDown = s.value != null && !s.value.answered && Date.now() - s.at < KNOWN_DOWN_MS
  return knownDown ? Math.min(waitMs, KNOWN_DOWN_WAIT_MS) : waitMs
}

// ---- Small helpers --------------------------------------------------------

const two = (n: number) => String(n).padStart(2, "0")
const nf = (n: number) => Math.round(n).toLocaleString("en-US")
const iso = (ms: number | null) => (ms == null ? null : new Date(ms).toISOString())
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)
const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null

/** "17:00 UTC". The date is carried by the sentence around it, or is today. */
function clockUtc(ms: number): string {
  const d = new Date(ms)
  return `${two(d.getUTCHours())}:${two(d.getUTCMinutes())} UTC`
}

/** Join a time to its zone with a no-break space, so a wrapped unit never strands "UTC". */
const together = (clock: string) => clock.replace(/ /g, "\u00a0")

function remember(id: NowId, ms: number | null): number | null {
  const prev = mem.heard[id] ?? null
  if (ms != null && (prev == null || ms > prev)) mem.heard[id] = ms
  return mem.heard[id] ?? null
}

const newest = (...ms: (number | null | undefined)[]): number | null => {
  let best: number | null = null
  for (const m of ms) if (m != null && (best == null || m > best)) best = m
  return best
}

function row(
  id: NowId,
  now: number,
  r: {
    value?: string | null
    unit?: string | null
    lastHeardMs: number | null
    error?: boolean
    checking?: boolean
    sentence: string
  }
): NowRow {
  const meta = META[id]
  const error = r.error ?? false
  let status: NowRow["status"]
  if (r.checking) status = "checking"
  else if (meta.freshness == null) status = "live"
  else status = readInstrument(meta.freshness, { lastHeardMs: r.lastHeardMs, error, now }).state
  // A reading belongs to an instrument that is answering. Once it is offline
  // the last number it gave is history, and printing it beside today's date
  // would be the exact lie this panel exists to stop.
  const current = status === "live" || status === "stale"
  return {
    id,
    label: meta.label,
    href: meta.href,
    value: current ? (r.value ?? null) : null,
    unit: current ? (r.unit ?? null) : null,
    lastHeard: iso(r.lastHeardMs),
    status,
    freshness: meta.freshness,
    error,
    sentence: r.sentence,
  }
}

/**
 * The sentence of a "checking" row. peekNow() output is rendered into HTML
 * that can be cached for an hour, so it is worded in the past and tied to the
 * snapshot's own time (`at`, which the panel prints): true whenever it is read.
 */
const notAsked = (name: string) =>
  `This server had not yet asked ${name} when it assembled this answer.`

/** Call one of the catch-all proxy routes in process. */
type ProxyGET = (
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) => Promise<Response>

async function viaProxy(
  get: ProxyGET,
  base: string,
  segs: string[]
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  // The host is never dialled: the handler only reads the path and the query.
  const req = new NextRequest(`http://now.internal/api/${base}/${segs.join("/")}`)
  const res = await get(req, { params: Promise.resolve({ path: segs }) })
  let body: Record<string, unknown> | null = null
  try {
    body = obj(await res.json())
  } catch {
    /* not JSON: nothing to read */
  }
  return { status: res.status, body }
}

/** What a proxy's failure body remembers about its upstream. */
function proxyMemory(body: Record<string, unknown> | null) {
  return {
    lastOkMs: toMs(body?.last_ok_iso as string | null | undefined),
    watchingSinceMs: toMs(body?.watching_since_iso as string | null | undefined),
  }
}

/** A proxy's own failure, as opposed to the upstream's answer passed through. */
const proxyFailed = (r: { status: number; body: Record<string, unknown> | null }) =>
  r.body == null || typeof r.body.error === "string"

// ---- The pulse ------------------------------------------------------------

const PULSE_FILE = path.join(process.cwd(), "public", "data", "activity-pulse.json")

/**
 * The latest minute that can be PROVED active, from a file that does not say.
 *
 * scripts/activity-pulse.py writes hourly counts and, since 2026-10-02, the
 * minute of the last activity too. For a file without that field, "is a
 * session running right now" has to be inferred, and the inference must never
 * claim more than the counts support. Three sources, the newest wins, every
 * one of them a lower bound:
 *
 *  1. `lastActive` in the file: the last entry of the script's minute log,
 *     ISO, or null when the log has none. Exact. Sources 2 and 3 remain for
 *     an older file or a missing field.
 *  2. Two readings of the file. If the hour in progress gained d active
 *     minutes between a file written at g1 and one written at g2, then even if
 *     those were the first d of the cron's runs in between, the last of them
 *     ran at g1 + d minutes. This process reads the file whenever a page
 *     polls, so while anyone is watching this is exact to the minute.
 *  3. One reading. The hour in progress has had `runs` cron runs and `thisHour`
 *     of them were active. If the idle ones all came last, the latest active
 *     run was (runs - thisHour) minutes before the file was written. With no
 *     activity this hour the same argument runs through the hour before.
 */
function pulseLastActive(p: {
  generatedMs: number
  hourStartMs: number
  thisHour: number
  lastHour: number
  fileLastActiveMs: number | null
}): number | null {
  const { generatedMs, hourStartMs, thisHour, lastHour } = p

  let tracked = mem.track?.lastActiveMs ?? null
  const prev = mem.track
  if (prev && generatedMs > prev.generatedMs) {
    let gained: number | null = null
    if (hourStartMs === prev.hourStartMs) gained = thisHour - prev.thisHour
    else if (hourStartMs - prev.hourStartMs === HOUR) gained = lastHour - prev.thisHour + thisHour
    if (gained != null && gained > 0) {
      tracked = newest(tracked, Math.min(generatedMs, prev.generatedMs + gained * MIN))
    }
  }

  const runs = Math.floor((generatedMs - hourStartMs) / MIN) + 1
  let cold: number | null = null
  if (thisHour > 0) cold = generatedMs - Math.max(0, runs - thisHour) * MIN
  else if (lastHour > 0) cold = generatedMs - (runs + (60 - lastHour)) * MIN

  const best = newest(p.fileLastActiveMs, tracked, cold)
  if (!prev || generatedMs >= prev.generatedMs) {
    mem.track = { generatedMs, hourStartMs, thisHour, lastActiveMs: best }
  }
  return best
}

async function readPulse(): Promise<Pulse> {
  const file = obj(JSON.parse(await fs.readFile(PULSE_FILE, "utf8")))
  const generatedMs = toMs(file?.generated as string | undefined)
  if (!file || generatedMs == null) throw new Error("pulse file has no generated time")

  const raw = Array.isArray(file.buckets) ? file.buckets : []
  const bars: PulseBar[] = []
  for (const b of raw) {
    const o = obj(b)
    const hour = typeof o?.hour === "string" ? toMs(`${o.hour}:00Z`) : null
    if (hour == null) continue
    bars.push({
      hour: new Date(hour).toISOString(),
      minutes: Math.max(0, Math.min(60, num(o?.minutes) ?? 0)),
      partial: bars.length === 0,
    })
  }

  // The file's buckets are the 24 COMPLETED clock hours. Its total is the
  // rolling 24 hours up to `generated`, so it also holds the hour in progress,
  // and the difference between the two is exactly that hour's count.
  const total24h = Math.max(0, num(file.totalActiveMinutes) ?? 0)
  const bucketed = bars.reduce((sum, b) => sum + b.minutes, 0)
  const thisHour = Math.max(0, Math.min(60, total24h - bucketed))
  const lastHour = bars.length ? bars[bars.length - 1].minutes : 0
  const hourStartMs = Math.floor(generatedMs / HOUR) * HOUR
  bars.push({ hour: new Date(hourStartMs).toISOString(), minutes: thisHour, partial: true })

  const lastActiveMs = pulseLastActive({
    generatedMs,
    hourStartMs,
    thisHour,
    lastHour,
    fileLastActiveMs: toMs(file.lastActive as string | undefined),
  })

  return {
    generated: new Date(generatedMs).toISOString(),
    total24h,
    thisHour,
    lastHour,
    hourStart: new Date(hourStartMs).toISOString(),
    lastActive: iso(lastActiveMs),
    bars,
    scope: typeof file.scope === "string" ? file.scope : "local",
    covers: typeof file.covers === "string" ? file.covers : "",
  }
}

function activityRow(a: Asked<Pulse>, now: number): NowRow {
  const p = a.value
  if (!p || a.missed) {
    return row("activity", now, {
      lastHeardMs: toMs(p?.generated),
      error: true,
      sentence: "The activity file could not be read on this server.",
    })
  }
  const hourStart = toMs(p.hourStart) ?? now
  return row("activity", now, {
    value: nf(p.thisHour),
    // The period is in the unit, so the reading stands without its sentence.
    unit: `active min since ${together(clockUtc(hourStart))}`,
    lastHeardMs: toMs(p.generated),
    sentence:
      `A Claude Code session was writing on this host in ${nf(p.thisHour)} of the minutes ` +
      `since ${clockUtc(hourStart)}, ${nf(p.lastHour)} in the hour before, and ` +
      `${nf(p.total24h)} of the last 24 hours.`,
  })
}

// ---- The edge firewall ----------------------------------------------------

export interface VisitorsSummary {
  /** When the collector built the snapshot, ISO. */
  generated: string
  /** The window the snapshot's totals cover, days. */
  windowDays: number | null
  /** The collector's own UTC day, so far. Null if the snapshot has no row for it. */
  today: {
    /** "YYYY-MM-DD", UTC. */
    day: string
    /** Scanner requests the trap closed the connection on. */
    trapped: number
    /** Requests from people. */
    humans: number
    /** Requests from bots that were served. */
    bots: number
  } | null
  /** The 30-day funnel, as /visitors prints it. */
  window: {
    edgeDropped: number
    trapped: number
    botsServed: number
    humanHits: number
    sessions: number
  } | null
  /** The router's banIP readout. Its counters cover the router's own uptime, not a day. */
  edge: { ok: boolean; feedDrops: number; floodDrops: number; blocklistIps: number | null } | null
  /** How many nginx sites the collector walked. */
  sites: number | null
}

async function readVisitors(): Promise<VisitorsSummary | null> {
  const res = await visitorsGET()
  if (!res.ok) return null
  const s = obj(await res.json())
  const generatedMs = toMs(num(s?.generated))
  if (!s || generatedMs == null) return null

  const day = new Date(generatedMs).toISOString().slice(0, 10)
  const dayRow = (list: unknown): Record<string, unknown> | null => {
    if (!Array.isArray(list)) return null
    for (const r of list) {
      const o = obj(r)
      if (o?.d === day) return o
    }
    return null
  }
  const scanners = obj(s.scanners)
  const visitors = obj(s.visitors)
  const trappedDay = dayRow(scanners?.byDay)
  const peopleDay = dayRow(visitors?.byDay)

  const funnel = obj(s.funnel)
  const edge = obj(s.edge)
  const sum = (list: unknown) =>
    Array.isArray(list) ? list.reduce((t: number, r) => t + (num(obj(r)?.pkts) ?? 0), 0) : 0

  return {
    generated: new Date(generatedMs).toISOString(),
    windowDays: num(s.windowDays),
    today:
      trappedDay || peopleDay
        ? {
            day,
            trapped: num(trappedDay?.hits) ?? 0,
            humans: num(peopleDay?.humans) ?? 0,
            bots: num(peopleDay?.bots) ?? 0,
          }
        : null,
    window: funnel
      ? {
          edgeDropped: num(funnel.edgeDropped) ?? 0,
          trapped: num(funnel.trapped) ?? 0,
          botsServed: num(funnel.botsServed) ?? 0,
          humanHits: num(funnel.humanHits) ?? 0,
          sessions: num(funnel.sessions) ?? 0,
        }
      : null,
    edge: edge
      ? {
          ok: edge.ok === true,
          feedDrops: sum(edge.feeds),
          floodDrops: sum(edge.flood),
          blocklistIps: num(edge.blocklistIps),
        }
      : null,
    sites: num(obj(obj(s.sources)?.access)?.sites),
  }
}

/** The slim visitors summary. Null when the collector has never written. */
export async function visitorsSummary(): Promise<VisitorsSummary | null> {
  const a = await ask("visitors", readVisitors, VISITORS_TTL_MS, LOCAL_WAIT_MS)
  return a.missed ? null : a.value
}

function firewallRow(a: Asked<VisitorsSummary | null>, now: number): NowRow {
  const v = a.value
  if (!v || a.missed) {
    return row("firewall", now, {
      lastHeardMs: toMs(v?.generated),
      error: true,
      sentence: "The visitors collector has not written a snapshot this server can read.",
    })
  }
  const generatedMs = toMs(v.generated) ?? now
  const today = new Date(now).toISOString().slice(0, 10)
  const sameDay = v.today?.day === today
  const where =
    v.sites != null ? `across the ${nf(v.sites)} sites this box serves` : "on this box"
  return row("firewall", now, {
    value: v.today ? nf(v.today.trapped) : null,
    // What is counted and over what period, so the reading stands by itself.
    unit: v.today
      ? sameDay
        ? `probes trapped since ${together("00:00 UTC")}`
        : `probes trapped on ${absDate(generatedMs)}`
      : null,
    lastHeardMs: generatedMs,
    sentence: v.today
      ? `Scanner requests refused at the door since 00:00 UTC, ${where}. ` +
        `Counted ${absDateTime(generatedMs)}.`
      : `The snapshot built ${absDateTime(generatedMs)} has no count for its own day.`,
  })
}

// ---- The Geiger counter ---------------------------------------------------

interface GeigerProbe {
  answered: boolean
  /** When the daemon last logged a decay event, epoch ms. */
  heardMs: number | null
  /** Counts a minute over the monitor's latest window. Null if it has no current one. */
  cpm: number | null
  /** How many gaps between events that window held. */
  cpmGaps: number | null
  /** When the monitor measured it, epoch ms. */
  cpmAtMs: number | null
  lastOkMs: number | null
  watchingSinceMs: number | null
}

async function readGeiger(): Promise<GeigerProbe> {
  // The two status paths the board itself polls. Neither draws entropy.
  const [h, m] = await Promise.all([
    viaProxy(trngGET, "trng", ["health"]),
    viaProxy(trngGET, "trng", ["metrics", "latest"]),
  ])
  const at = Date.now()
  if (proxyFailed(h)) {
    const a = proxyMemory(h.body)
    const b = proxyMemory(m.body)
    return {
      answered: false,
      heardMs: null,
      cpm: null,
      cpmGaps: null,
      cpmAtMs: null,
      lastOkMs: newest(a.lastOkMs, b.lastOkMs),
      watchingSinceMs: a.watchingSinceMs ?? b.watchingSinceMs,
    }
  }
  // An unhealthy daemon answers 503 with the same payload under `detail`.
  const health = obj(h.body?.detail) ?? h.body
  const age = num(health?.events_csv_age_s)
  // The count rate. No board prints one, so this is where it is derived, and
  // from what: /metrics/latest is the newest row the daemon's monitor wrote
  // (the geiger repo's monitor.py, on a five-minute timer). Its mean_dt_ms is
  // the plain mean of the gaps between consecutive rows of the event log over
  // the trailing `window_deltas` gaps (1024 by default): np.diff of the raw
  // timestamps, before the reject_us filter, which belongs to bit extraction
  // and not to this number. So 60 000 / mean_dt_ms is counts a minute over
  // that window as of the row's ts_iso. The mean can come out zero or negative
  // when the box's clock stepped inside the window; that is not a rate and is
  // not printed. Nor is a row more than three monitor runs old: the daemon can
  // answer while its monitor has stopped, and an old mean is not a reading.
  // READ FROM THE SOURCE, NOT YET SEEN AGAINST THE BOX: it has been off the
  // LAN since this was written. When it returns, check the first figure this
  // prints against the event log's own line count for a minute.
  const metric = proxyFailed(m) ? null : obj(m.body?.row)
  const dt = num(metric?.mean_dt_ms)
  const measuredMs = toMs(metric?.ts_iso as string | undefined)
  const current =
    dt != null && dt > 0 && measuredMs != null && at - measuredMs < GEIGER_MONITOR_MAX_AGE_MS
  return {
    answered: true,
    heardMs: age != null && age >= 0 ? at - age * 1000 : at,
    cpm: current ? MIN / dt : null,
    cpmGaps: current ? num(metric?.window_deltas) : null,
    cpmAtMs: current ? measuredMs : null,
    lastOkMs: at,
    watchingSinceMs: null,
  }
}

/** The probe's marker file: the last time it saw the box up, kept across restarts. */
async function readGeigerMarker(): Promise<number | null> {
  const res = await hotbitsProbeGET()
  const body = obj(await res.json())
  return toMs(body?.last_up_iso as string | undefined)
}

function geigerRow(a: Asked<GeigerProbe>, markerMs: number | null, peek: boolean, now: number) {
  const ok = usable(a, peek, now)
  const p = a.value
  if (ok && p && p.answered) {
    const heard = remember("geiger", p.heardMs)
    const rate =
      p.cpm != null && p.cpmAtMs != null
        ? ` The rate is the mean over ${
            p.cpmGaps != null ? `the last ${nf(p.cpmGaps)} events` : "its latest window"
          }, measured ${absDateTime(p.cpmAtMs)}.`
        : ""
    return row("geiger", now, {
      value: p.cpm != null ? nf(p.cpm) : "answering",
      unit: p.cpm != null ? "counts/min" : null,
      lastHeardMs: heard,
      sentence:
        `The Geiger daemon answered. Its last decay event was logged ` +
        `${heard != null ? absDateTime(heard) : "at an unknown time"}.` +
        rate,
    })
  }
  const lastHeardMs = newest(remember("geiger", null), p?.lastOkMs, markerMs)
  if (!ok && peek) {
    return row("geiger", now, {
      lastHeardMs,
      checking: true,
      sentence: notAsked("the Geiger box"),
    })
  }
  const since =
    lastHeardMs == null && p?.watchingSinceMs != null
      ? ` This server has been asking since ${absDateTime(p.watchingSinceMs)} and has not heard it.`
      : ""
  return row("geiger", now, {
    lastHeardMs,
    error: true,
    sentence:
      (ok
        ? "The Geiger box is not answering."
        : `The Geiger box did not answer within ${NETWORK_WAIT_MS / 1000} s.`) + since,
  })
}

// ---- The perception bus ---------------------------------------------------

interface BusProbe {
  readable: boolean
  eventsPerSec: number | null
  lastEventMs: number | null
  /** When the collector last rewrote its snapshot, epoch ms. */
  snapshotMs: number | null
}

async function readBus(): Promise<BusProbe> {
  const res = await worldeventGET()
  const body = obj(await res.json())
  if (!res.ok || !body || body.offline === true) {
    return { readable: false, eventsPerSec: null, lastEventMs: null, snapshotMs: null }
  }
  return {
    readable: true,
    eventsPerSec: num(obj(body.totals)?.eventsPerSec),
    lastEventMs: toMs(body.lastEventAt as string | null),
    snapshotMs: toMs(body.snapshotAt as string | null),
  }
}

function busRow(a: Asked<BusProbe>, now: number): NowRow {
  const p = a.value
  if (!p || a.missed || !p.readable) {
    return row("bus", now, {
      lastHeardMs: remember("bus", null),
      error: true,
      sentence: "The bus collector has left no snapshot this server can read.",
    })
  }
  const heard = remember("bus", p.lastEventMs)
  // The collector rewrites its file every second. A minute without a rewrite
  // means its rate is a frozen number, not a measurement.
  const collectorUp = p.snapshotMs != null && now - p.snapshotMs < MIN
  const speaking = heard != null && now - heard < MIN
  let sentence: string
  if (!collectorUp) {
    sentence =
      p.snapshotMs != null
        ? `The collector stopped writing ${absDateTime(p.snapshotMs)}, so there is no current rate.`
        : "The collector's snapshot has no time on it."
  } else if (speaking) {
    sentence = "Producers are broadcasting and the collector is counting them."
  } else {
    sentence = "The collector is listening and no producer is broadcasting."
  }
  const r = row("bus", now, {
    lastHeardMs: heard,
    error: !collectorUp && heard == null,
    sentence,
  })
  // The one exception to "no value while offline": a collector that is up and
  // hears nothing is measuring a true zero, now, and that is worth printing.
  if (collectorUp && p.eventsPerSec != null) {
    r.value = p.eventsPerSec.toFixed(1)
    r.unit = "events/s"
  }
  return r
}

// ---- The cameras ----------------------------------------------------------

interface CameraProbe {
  /** When the newest frame was captured, epoch ms. */
  frameMs: number | null
}

async function readCameras(): Promise<CameraProbe> {
  const res = await eyesMetaGET()
  const body = obj(await res.json())
  // latest.json's own epoch is the capture time; the JPEG's mtime is the
  // cross-check for a capture script that died before writing the sidecar.
  return {
    frameMs: newest(toMs(num(body?.epoch)), toMs(obj(body?.senses)?.camera as string | null)),
  }
}

function camerasRow(a: Asked<CameraProbe>, now: number): NowRow {
  const p = a.value
  if (!p || a.missed) {
    return row("cameras", now, {
      lastHeardMs: remember("cameras", null),
      error: true,
      sentence: "The camera's frame store could not be read on this server.",
    })
  }
  const heard = remember("cameras", p.frameMs)
  const r = row("cameras", now, {
    value: heard != null ? clockUtc(heard) : null,
    unit: heard != null ? "last frame" : null,
    lastHeardMs: heard,
    sentence: "",
  })
  r.sentence =
    r.status === "live"
      ? "The camera is writing a frame a minute."
      : r.status === "stale"
        ? "The camera has missed its last few frames."
        : heard != null
          ? "The capture service has stopped writing frames."
          : "No frame has ever been written on this server."
  return r
}

// ---- Fleet -----------------------------------------------------------------

interface FleetProbe {
  answered: boolean
  configured: boolean
  /** The newest message the collector received off the bus, epoch ms. */
  heardMs: number | null
  nodes: number
  reporting: number
  lastOkMs: number | null
  watchingSinceMs: number | null
}

async function readFleet(): Promise<FleetProbe> {
  const r = await viaProxy(fleetGET, "fleet", ["state.json"])
  const at = Date.now()
  if (proxyFailed(r) || r.status >= 400) {
    return {
      answered: false,
      configured: r.body?.error !== "worldsink_unconfigured",
      heardMs: null,
      nodes: 0,
      reporting: 0,
      ...proxyMemory(r.body),
    }
  }
  const nodes = Object.values(obj(r.body?.nodes) ?? {})
  const age = num(r.body?.last_recv_age_s)
  return {
    answered: true,
    configured: true,
    heardMs: age != null && age >= 0 ? at - age * 1000 : at,
    nodes: nodes.length,
    reporting: nodes.filter((n) => obj(n)?.stale !== true).length,
    lastOkMs: at,
    watchingSinceMs: null,
  }
}

/** The shared shape of a network instrument that is not giving a reading. */
function silentRow(
  id: "fleet",
  name: string,
  a: Asked<{ lastOkMs: number | null; watchingSinceMs: number | null }>,
  ok: boolean,
  peek: boolean,
  now: number,
  override?: string
): NowRow {
  const p = a.value
  const lastHeardMs = newest(remember(id, null), p?.lastOkMs)
  if (!ok && peek) {
    return row(id, now, {
      lastHeardMs,
      checking: true,
      sentence: notAsked(name),
    })
  }
  const since =
    lastHeardMs == null && p?.watchingSinceMs != null
      ? ` This server has been asking since ${absDateTime(p.watchingSinceMs)} and has not heard it.`
      : ""
  const Name = name.charAt(0).toUpperCase() + name.slice(1)
  return row(id, now, {
    lastHeardMs,
    error: true,
    sentence:
      override ??
      (ok
        ? `${Name} is not answering.`
        : `${Name} did not answer within ${NETWORK_WAIT_MS / 1000} s.`) + since,
  })
}

function fleetRow(a: Asked<FleetProbe>, peek: boolean, now: number): NowRow {
  const ok = usable(a, peek, now)
  const p = a.value
  if (ok && p && p.answered) {
    const heard = remember("fleet", p.heardMs)
    return row("fleet", now, {
      value: `${nf(p.reporting)} of ${nf(p.nodes)}`,
      unit: "nodes reporting",
      lastHeardMs: heard,
      sentence:
        `The fleet collector answered. Its newest message off the bus arrived ` +
        `${heard != null ? absDateTime(heard) : "at an unknown time"}.`,
    })
  }
  return silentRow(
    "fleet",
    "the fleet collector",
    a,
    ok,
    peek,
    now,
    ok && p && !p.configured
      ? "This server holds no credential for the fleet collector, so it cannot ask."
      : undefined
  )
}

// ---- The build ------------------------------------------------------------

function buildRow(now: number): NowRow {
  const builtMs = toMs(buildInfo.buildTime)
  return row("build", now, {
    value: buildInfo.version,
    lastHeardMs: builtMs,
    sentence:
      `Built ${builtMs != null ? absDateTime(builtMs) : "at an unknown time"} ` +
      `from commit ${buildInfo.commitHash}. This is the build answering you.`,
  })
}

// ---- Assembly -------------------------------------------------------------

async function assemble(networkWaitMs: number): Promise<NowSnapshot> {
  const peek = networkWaitMs === 0

  // The marker probe is fire-and-forget: it is only ever a fallback for "when
  // was the box last up", and it must not hold anything else back.
  void ask("geiger-marker", readGeigerMarker, PROBE_TTL_MS, 0)

  const [pulse, visitors, bus, cameras, geiger, fleet] = await Promise.all([
    ask("pulse", readPulse, SNAPSHOT_TTL_MS, LOCAL_WAIT_MS),
    ask("visitors", readVisitors, VISITORS_TTL_MS, LOCAL_WAIT_MS),
    ask("bus", readBus, SNAPSHOT_TTL_MS, LOCAL_WAIT_MS),
    ask("cameras", readCameras, SNAPSHOT_TTL_MS, LOCAL_WAIT_MS),
    ask("geiger", readGeiger, SNAPSHOT_TTL_MS, networkWait("geiger", networkWaitMs)),
    ask("fleet", readFleet, SNAPSHOT_TTL_MS, networkWait("fleet", networkWaitMs)),
  ])

  const now = Date.now()
  const markerMs = slot<number | null>("geiger-marker").value
  const rows: Record<NowId, NowRow> = {
    activity: activityRow(pulse, now),
    firewall: firewallRow(visitors, now),
    geiger: geigerRow(geiger, markerMs, peek, now),
    bus: busRow(bus, now),
    cameras: camerasRow(cameras, now),
    fleet: fleetRow(fleet, peek, now),
    build: buildRow(now),
  }
  return {
    at: new Date(now).toISOString(),
    rows: NOW_ORDER.map((id) => rows[id]),
    pulse: pulse.missed ? null : pulse.value,
  }
}

/** A snapshot that could not be assembled at all. Should be unreachable. */
function failed(): NowSnapshot {
  const now = Date.now()
  return { at: new Date(now).toISOString(), rows: [buildRow(now)], pulse: null }
}

/** The full answer, at most 10 s old. See the head of this file. */
export async function getNow(): Promise<NowSnapshot> {
  if (mem.snapshot && Date.now() - mem.snapshotAt < SNAPSHOT_TTL_MS) return mem.snapshot
  if (!mem.building) {
    mem.building = assemble(NETWORK_WAIT_MS)
      .then((snap) => {
        mem.snapshot = snap
        mem.snapshotAt = Date.now()
        return snap
      })
      .catch(() => failed())
      .finally(() => {
        mem.building = null
      })
  }
  return mem.building
}

/** The answer without waiting on the network. See the head of this file. */
export async function peekNow(): Promise<NowSnapshot> {
  if (mem.snapshot && Date.now() - mem.snapshotAt < SNAPSHOT_TTL_MS) return mem.snapshot
  try {
    return await assemble(0)
  } catch {
    return failed()
  }
}
