/**
 * Instrument status: is a reading live, stale, or is the instrument offline?
 *
 * The site's instruments read real hardware over a network, and hardware goes
 * away. A camera gets unplugged and its last frame keeps being served with a
 * 200; a Geiger box drops off the LAN and its board renders empty. Neither is
 * a lie in the data, but both are a lie on the page if nothing says how old
 * the reading is. This file is the one place that decides.
 *
 * Everything here is a pure function. Nothing reads the clock: the caller
 * passes `now`, which is what lets the same code run during a server render
 * (where "now" is the wrong moment and must not be baked into HTML) and in the
 * browser. The React side is components/kit/InstrumentStatus.tsx.
 *
 * Three states, and the word carries the state so it survives without colour:
 *
 *   live     the instrument was heard within its freshness threshold
 *   stale    it was heard, but longer ago than it should take; late, not gone
 *   offline  it did not answer, or has been silent so long that "late" would
 *            be a kindness
 *
 * A stale or offline instrument is ATTENTION (orange). It is never red: red
 * means an assertion failed, and a box being unplugged is not an assertion.
 */

export type InstrumentState = "live" | "stale" | "offline"

export interface Freshness {
  /** Older than this and the reading is late: STALE. Seconds. */
  staleAfterS: number
  /** Older than this and the instrument is treated as gone: OFFLINE. Seconds. */
  offlineAfterS: number
}

/**
 * THE freshness table. One row per instrument, each threshold derived from how
 * often that instrument is supposed to speak. Change a cadence upstream and
 * this is the only place the site needs to hear about it.
 */
export const FRESHNESS = {
  // Claude Code activity pulse (the "Running now" panel, the masthead dot).
  // Last heard is when cron last rewrote public/data/activity-pulse.json;
  // scripts/activity-pulse.py runs every 60 s. Three missed runs is late,
  // fifteen is a cron that has stopped. The numbers are the camera's because
  // the cadence is the camera's; the row is its own so that changing one
  // schedule does not quietly change the other. This judges the FILE, not
  // whether anyone is at the keyboard: an idle host with a healthy cron is
  // LIVE with zero active minutes.
  activity: { staleAfterS: 180, offlineAfterS: 900 },

  // Camera frame (/eyes, /meatball). bradley-cam.timer grabs one frame every
  // 60 s. Three missed frames is late; fifteen is a camera that is not there.
  camera: { staleAfterS: 180, offlineAfterS: 900 },

  // Motion tracker (/meatball, /meatball/log, /meatball/memory). bradley-delta
  // compares frames roughly every 10 s per camera, so a minute of silence is
  // six missed comparisons and ten minutes is a stopped service.
  motion: { staleAfterS: 60, offlineAfterS: 600 },

  // Mic listener (/meatball ears and the greeter, which hears through it).
  // bradley-ears rewrites each mic's status about once a second.
  ears: { staleAfterS: 30, offlineAfterS: 300 },

  // Geiger counter (/trng). Last heard is the age of the daemon's decay-event
  // log. Background radiation gives several events a minute, so two minutes
  // without one means the logger stalled and fifteen means it is down.
  geiger: { staleAfterS: 120, offlineAfterS: 900 },

  // WorldEvent bus (/dragonfli/worldevent). With any producer up the bus
  // carries many events a second; last heard is the newest event of any
  // schema. A quiet minute is unusual, ten quiet minutes is a dead emitter.
  worldevent: { staleAfterS: 60, offlineAfterS: 600 },

  // Fleet collector (/fleet). Last heard is the collector's own
  // last_recv_age_s. Nodes heartbeat well inside two minutes, which was the
  // board's "receiving" line before this table existed.
  fleet: { staleAfterS: 120, offlineAfterS: 900 },

  // ADS-B receiver (/dragonfli, /dragonfli/airspace). Last heard is the last
  // ADS-B frame off the 1090 antenna: the newest last_seen among the aircraft
  // the decoder is tracking, or the perception bus's last adsb.mode_s /
  // adsb.uat event, whichever is newer (adsbLastHeard in
  // components/dragonfli/api.ts). It is NOT the decoder's /health
  // last_event_age_s: that is the last bus envelope of any kind, and GPS
  // frames keep it under a second while the radio is dead. Overnight the sky
  // here can be quiet for a few minutes at a time, so ten minutes before
  // calling it late and an hour before calling it gone.
  adsb: { staleAfterS: 600, offlineAfterS: 3600 },

  // GPS receiver (/dragonfli/gps). Fix and satellite frames arrive about once
  // a second on the stream.
  gps: { staleAfterS: 30, offlineAfterS: 300 },

  // Visitors snapshot (/visitors). A systemd timer rewrites it every ten
  // minutes and a run takes about two, so half an hour is three missed runs.
  visitors: { staleAfterS: 1800, offlineAfterS: 21_600 },
} as const satisfies Record<string, Freshness>

export type InstrumentKey = keyof typeof FRESHNESS

/** Why the state is what it is. The page words its sentence off this. */
export type InstrumentReason =
  | "fresh" // heard within the stale threshold
  | "late" // heard, older than the stale threshold
  | "silent" // heard, older than the offline threshold
  | "unreachable" // the upstream did not answer at all
  | "no-data" // it answered, and had nothing with a time on it

export interface InstrumentReading {
  state: InstrumentState
  reason: InstrumentReason
  /** When the instrument was last heard, epoch ms. Null if never, or unknown. */
  lastHeardMs: number | null
  /** Seconds since it was last heard. Null when lastHeardMs is. */
  ageS: number | null
}

/**
 * Anything timestamp-shaped to epoch milliseconds, or null.
 *
 * Numbers below 1e12 are taken as epoch SECONDS: the pipelines here write
 * seconds (latest.json's epoch, the bus's lastTs) and 1e12 ms is 2001, so no
 * real millisecond stamp on this site is under it.
 */
export function toMs(t: number | string | Date | null | undefined): number | null {
  if (t == null) return null
  if (t instanceof Date) {
    const v = t.getTime()
    return Number.isFinite(v) ? v : null
  }
  if (typeof t === "number") {
    if (!Number.isFinite(t) || t <= 0) return null
    return Math.round(t < 1e12 ? t * 1000 : t)
  }
  const v = Date.parse(t)
  return Number.isFinite(v) ? v : null
}

/**
 * The decision. An upstream error always wins: if the instrument did not
 * answer, an old timestamp does not make it less offline, it only says since
 * when.
 */
export function readInstrument(
  key: InstrumentKey,
  input: { lastHeardMs: number | null; error?: boolean; now: number }
): InstrumentReading {
  const { lastHeardMs, error = false, now } = input
  // A stamp slightly ahead of this clock is skew, not time travel.
  const ageS = lastHeardMs == null ? null : Math.max(0, (now - lastHeardMs) / 1000)

  if (error) return { state: "offline", reason: "unreachable", lastHeardMs, ageS }
  if (ageS == null) return { state: "offline", reason: "no-data", lastHeardMs, ageS }

  const f: Freshness = FRESHNESS[key]
  if (ageS > f.offlineAfterS) return { state: "offline", reason: "silent", lastHeardMs, ageS }
  if (ageS > f.staleAfterS) return { state: "stale", reason: "late", lastHeardMs, ageS }
  return { state: "live", reason: "fresh", lastHeardMs, ageS }
}

// ---- Formatting -----------------------------------------------------------
// Absolute times are formatted by hand, in UTC, from the epoch. Not
// toLocaleDateString: that resolves against the local timezone, the server and
// the browser are rarely in the same one, and the mismatch is React #418.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const two = (n: number) => String(n).padStart(2, "0")

/** "11 Sep 2026". UTC, deterministic, safe to server-render. */
export function absDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "11 Sep 2026 12:57 UTC". UTC, deterministic, safe to server-render. */
export function absDateTime(ms: number): string {
  const d = new Date(ms)
  return `${absDate(ms)} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())} UTC`
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`

/** A duration a person can read: "40 s", "7 min", "5 h", "3 weeks". */
export function ageWords(seconds: number): string {
  const s = Math.max(0, seconds)
  if (s < 90) return `${Math.round(s)} s`
  if (s < 5400) return `${Math.round(s / 60)} min`
  if (s < 129_600) return `${Math.round(s / 3600)} h`
  const days = s / 86_400
  if (days < 14) return plural(Math.round(days), "day")
  if (days < 63) return plural(Math.round(days / 7), "week")
  if (days < 730) return plural(Math.round(days / 30.44), "month")
  return plural(Math.round(days / 365.25), "year")
}

/**
 * "3 weeks ago" when a clock is available, the absolute time when it is not.
 * `now` is null during a server render and on the first client render, which
 * is exactly when a relative time must not be produced.
 */
export function relOrAbs(at: number | string | null | undefined, now: number | null): string {
  const ms = toMs(at)
  if (ms == null) return "at an unknown time"
  if (now == null) return absDateTime(ms)
  return `${ageWords((now - ms) / 1000)} ago`
}

const WEEK_S = 7 * 86_400

/**
 * When it was last heard, as the tag prints it. Within a week the time of day
 * matters ("was that this morning?"); beyond that the date is the fact.
 */
export function lastHeardText(lastHeardMs: number, ageS: number | null): string {
  return ageS != null && ageS < WEEK_S ? absDateTime(lastHeardMs) : absDate(lastHeardMs)
}

/** The tag's text after the state word, or null when the word says it all. */
export function statusDetail(r: InstrumentReading): string | null {
  if (r.state === "live") return null
  if (r.state === "stale") return r.ageS == null ? null : `${ageWords(r.ageS)} old`
  if (r.lastHeardMs != null) return `last heard ${lastHeardText(r.lastHeardMs, r.ageS)}`
  return r.reason === "unreachable" ? "not answering" : "no data"
}

/** "OFFLINE · last heard 11 Sep 2026", "STALE · 7 min old", "LIVE". */
export function statusLabel(r: InstrumentReading): string {
  const detail = statusDetail(r)
  const word = r.state.toUpperCase()
  return detail ? `${word} · ${detail}` : word
}

// ---- Upstream memory ------------------------------------------------------
// The proxy routes (/api/trng, /api/fleet) remember when their
// upstream last answered and say so in the body of a failure. These helpers
// carry that from the failed Response to the board.

export interface UpstreamMemory {
  /** When the proxy last got an answer from the upstream, epoch ms. */
  lastOkMs: number | null
  /** When the proxy started keeping track (its process start), epoch ms. */
  watchingSinceMs: number | null
}

export const NO_MEMORY: UpstreamMemory = { lastOkMs: null, watchingSinceMs: null }

export class UpstreamError extends Error {
  readonly status: number
  readonly memory: UpstreamMemory

  constructor(message: string, status: number, memory: UpstreamMemory) {
    super(message)
    this.name = "UpstreamError"
    this.status = status
    this.memory = memory
  }
}

/** Build the error for a non-OK proxy response, keeping what the proxy remembered. */
export async function upstreamError(label: string, res: Response): Promise<UpstreamError> {
  let memory = NO_MEMORY
  try {
    const body = (await res.clone().json()) as {
      last_ok_iso?: string | null
      watching_since_iso?: string | null
    } | null
    memory = {
      lastOkMs: toMs(body?.last_ok_iso),
      watchingSinceMs: toMs(body?.watching_since_iso),
    }
  } catch {
    /* an HTML error page, or no body: nothing remembered */
  }
  return new UpstreamError(`${label}: ${res.status}`, res.status, memory)
}

/** The best memory among a poll's failures: newest last-ok, oldest watch start. */
export function upstreamMemory(reasons: unknown[]): UpstreamMemory {
  let lastOkMs: number | null = null
  let watchingSinceMs: number | null = null
  for (const r of reasons) {
    if (!(r instanceof UpstreamError)) continue
    const m = r.memory
    if (m.lastOkMs != null && (lastOkMs == null || m.lastOkMs > lastOkMs)) lastOkMs = m.lastOkMs
    if (m.watchingSinceMs != null && (watchingSinceMs == null || m.watchingSinceMs < watchingSinceMs)) {
      watchingSinceMs = m.watchingSinceMs
    }
  }
  return { lastOkMs, watchingSinceMs }
}
