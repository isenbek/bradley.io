/**
 * The shapes /api/now answers with, shared by the server that assembles them
 * (components/live/now-snapshot.ts) and the client components that draw them.
 *
 * Types and plain constants only. Nothing here imports a server module, so a
 * client component can import from this file without pulling `fs` into the
 * browser bundle.
 *
 * EXPORTS
 *   NowSnapshot   the whole answer: when it was assembled, one row per
 *                 instrument, and the 24-hour Claude Code pulse
 *   NowRow        one instrument: id, label, href, value + unit, lastHeard,
 *                 status, the freshness row that judged it, a plain sentence
 *   NowStatus     "live" | "stale" | "offline" | "checking"
 *   NowId         the instrument ids, in display order (NOW_ORDER)
 *   Pulse         the last 24 hours of Claude Code activity on this host
 *   PulseBar      one clock hour of that
 *   NOW_POLL_MS   how often a page asks (15 s)
 *   ACTIVE_WINDOW_S  how recent activity must be to count as "active now"
 */

import type { InstrumentKey, InstrumentState } from "@/lib/instrument-status"

/** The instruments /api/now reports, in the order the panel lists them. */
export const NOW_ORDER = [
  "activity",
  "firewall",
  "geiger",
  "bus",
  "cameras",
  "fleet",
  "sdr",
  "build",
] as const

export type NowId = (typeof NOW_ORDER)[number]

/**
 * `checking` is the one state lib/instrument-status.ts does not have. It means
 * this server has not asked the instrument yet (a cold start rendered without
 * waiting on the network), which is neither live nor offline and is shown as
 * neither.
 */
export type NowStatus = InstrumentState | "checking"

export interface NowRow {
  id: NowId
  /** The instrument's name, as the menu spells it. */
  label: string
  /** Its page on this site. Null for the build, which has none. */
  href: string | null
  /**
   * The headline reading, already formatted ("11,963", "0.0", "v1.0.412").
   * Null when there is no CURRENT reading: an instrument that is not answering
   * has no value, however recently it had one.
   */
  value: string | null
  /**
   * What the value counts and over what period ("probes trapped since
   * 00:00 UTC"), complete enough that value + unit stands without the sentence.
   */
  unit: string | null
  /** When the instrument was last heard, ISO. Null if never, or not known. */
  lastHeard: string | null
  /** Judged on the server at `NowSnapshot.at`. Clients re-judge on their own clock. */
  status: NowStatus
  /**
   * The row of FRESHNESS (lib/instrument-status.ts) the status was judged
   * against, so a client can judge again as time passes. Null for the build,
   * which does not go stale: it is the thing answering.
   */
  freshness: InstrumentKey | null
  /** The last attempt to reach the instrument failed or timed out. */
  error: boolean
  /** One plain sentence. Absolute times only, so it is true whenever it is read. */
  sentence: string
}

export interface PulseBar {
  /** Start of the clock hour, ISO, UTC. */
  hour: string
  /** Minutes in that hour with a Claude Code session writing. 0 to 60. */
  minutes: number
  /**
   * True for the two bars that are not a whole hour: the oldest (only the part
   * still inside the 24-hour window) and the newest (the hour in progress).
   */
  partial: boolean
}

export interface Pulse {
  /** When the cron wrote the file, ISO. It runs every minute. */
  generated: string
  /** Active minutes in the 24 hours up to `generated`. */
  total24h: number
  /** Active minutes since the top of the hour in progress. */
  thisHour: number
  /** Active minutes in the last completed clock hour. */
  lastHour: number
  /** Start of the hour in progress, ISO, UTC. */
  hourStart: string
  /**
   * The latest minute KNOWN to have been active, ISO. A lower bound: activity
   * may be more recent than this, never older. Null when nothing can be proved
   * from the file (see pulseLastActive in now-snapshot.ts).
   */
  lastActive: string | null
  /**
   * 25 bars: the 24 completed clock hours the file carries plus the hour in
   * progress. A rolling 24-hour window touches 25 clock hours, and these sum
   * to `total24h` exactly.
   */
  bars: PulseBar[]
  /** "local": this host only. The file says so and the UI must repeat it. */
  scope: string
  /** The file's own sentence about what it does and does not count. */
  covers: string
}

export interface NowSnapshot {
  /** When this answer was assembled, ISO. */
  at: string
  rows: NowRow[]
  /** Null when the pulse file could not be read. */
  pulse: Pulse | null
}

/** How often a page asks /api/now. The server caches for 10 s under that. */
export const NOW_POLL_MS = 15_000

/**
 * How recent the last known active minute must be for "active now", seconds.
 * The cron samples once a minute, so anything under two minutes would flicker
 * between runs; five says "someone is at the keyboard" without claiming more.
 */
export const ACTIVE_WINDOW_S = 300
