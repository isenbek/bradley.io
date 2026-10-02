"use client"

import { useSyncExternalStore } from "react"
import { FRESHNESS } from "@/lib/instrument-status"
import { NOW_POLL_MS, type NowRow, type NowSnapshot, type Pulse } from "./types"

/**
 * useLiveNow: the page's one subscription to /api/now.
 *
 *   const { data, failed } = useLiveNow(initial)
 *
 * PROPS
 *   initial   a NowSnapshot rendered on the server (peekNow() or getNow() from
 *             ./now-snapshot), or nothing. It is what the first render shows,
 *             on the server and in the browser alike, so hydration agrees.
 *   options   { frozen?: boolean }. Frozen means "show `initial` and never
 *             ask": for a specimen or a test that supplies its own data.
 *
 * RETURNS
 *   data      the newest snapshot this page has, or null before any arrived.
 *             Always well formed: `rows` is an array, `pulse` is a Pulse or null.
 *   failed    the last poll got no fresh answer (see WHAT COUNTS AS AN ANSWER);
 *             `data` is then the newest this page has, and its own `at` says
 *             how old that is
 *
 * Also exported: readSnapshot(unknown) -> NowSnapshot | null, the shape check.
 *
 * ONE POLLER, HOWEVER MANY READERS. NowPanel, ActivityPulse and LiveDot can
 * all be on one page and all call this; there is one timer and one request
 * every 15 s between them, because the state lives in this module and not in
 * any component. The poller starts with the first subscriber and stops with
 * the last.
 *
 * IT PAUSES WHEN NOBODY IS LOOKING. A hidden tab asks for nothing. When the
 * tab comes back it asks at once if its data is older than one interval, so
 * what the reader returns to is current within a moment rather than whenever
 * the next tick would have been.
 *
 * It never fabricates. A failed poll changes `failed` and nothing else: the
 * rows keep their real last-heard times and go stale on the reader's own
 * clock (see InstrumentStatus), which is the honest thing for them to do.
 *
 * WHAT COUNTS AS AN ANSWER. Only a body that is a snapshot (readSnapshot,
 * below). These components sit on the home page and in the masthead, so one
 * body of the wrong shape must cost one poll and never a page: a deploy can
 * leave an old tab talking to a new server, and public/sw.js replays the last
 * /api/* answer it cached when the network is down. Three things are a failed
 * poll and leave the last good snapshot on screen:
 *   1. no answer within 8 s (the request is abandoned so the next can go out)
 *   2. a body that is not a snapshot
 *   3. a snapshot assembled more than a minute ago by this browser's clock.
 *      The server holds an answer for 10 s, so an older one is a replay from a
 *      cache, not the server speaking. It is still shown if it is the newest
 *      this page has (its own `at` says how old it is) and `failed` says that
 *      nothing fresh arrived. A browser whose clock runs more than about a
 *      minute fast reads every answer this way; its tags read STALE for the
 *      same reason, so the page is at least consistent about it.
 */

/** A poll that has not answered by now is abandoned. */
const POLL_TIMEOUT_MS = 8_000
/** An answer older than this on arrival came out of a cache. The server's is 10 s. */
const REPLAY_AGE_MS = 60_000

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
const strOrNull = (v: unknown): string | null => (typeof v === "string" ? v : null)
const count = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0)

function readRow(v: unknown): NowRow | null {
  if (!isObj(v) || typeof v.id !== "string" || typeof v.label !== "string") return null
  const freshness = v.freshness
  // A freshness row this bundle has never heard of (a newer server) cannot be
  // judged here, and the lookup would throw. The row is left out, not guessed.
  if (freshness != null && !(typeof freshness === "string" && freshness in FRESHNESS)) return null
  const status = v.status
  return {
    id: v.id as NowRow["id"],
    label: v.label,
    href: strOrNull(v.href),
    value: strOrNull(v.value),
    unit: strOrNull(v.unit),
    lastHeard: strOrNull(v.lastHeard),
    status:
      status === "live" || status === "stale" || status === "offline" ? status : "checking",
    freshness: (freshness ?? null) as NowRow["freshness"],
    error: v.error === true,
    sentence: typeof v.sentence === "string" ? v.sentence : "",
  }
}

function readPulse(v: unknown): Pulse | null {
  if (!isObj(v) || typeof v.generated !== "string" || !Array.isArray(v.bars)) return null
  const bars: Pulse["bars"] = []
  for (const b of v.bars) {
    if (!isObj(b) || typeof b.hour !== "string") return null
    bars.push({ hour: b.hour, minutes: count(b.minutes), partial: b.partial === true })
  }
  return {
    generated: v.generated,
    total24h: count(v.total24h),
    thisHour: count(v.thisHour),
    lastHour: count(v.lastHour),
    hourStart: typeof v.hourStart === "string" ? v.hourStart : v.generated,
    lastActive: strOrNull(v.lastActive),
    bars,
    scope: typeof v.scope === "string" ? v.scope : "local",
    covers: typeof v.covers === "string" ? v.covers : "",
  }
}

/**
 * A parsed /api/now body as a NowSnapshot, or null if it is not one. Rows that
 * cannot be read are dropped one by one; a pulse that cannot be read is null,
 * which the components already draw as "no pulse".
 */
export function readSnapshot(v: unknown): NowSnapshot | null {
  if (!isObj(v) || typeof v.at !== "string" || !Array.isArray(v.rows)) return null
  if (!Number.isFinite(Date.parse(v.at))) return null
  const rows: NowRow[] = []
  for (const r of v.rows) {
    const row = readRow(r)
    if (row) rows.push(row)
  }
  return { at: v.at, rows, pulse: readPulse(v.pulse) }
}

interface Store {
  data: NowSnapshot | null
  failed: boolean
  /** When the last attempt finished, epoch ms on this browser's clock. */
  askedAt: number
}

let store: Store = { data: null, failed: false, askedAt: 0 }
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | null = null
/** Bumped by every schedule() and by stop(), so a timer knows if it was superseded. */
let generation = 0

interface Flight {
  ac: AbortController
  /** Dropped because nobody is listening any more: its outcome is not reported. */
  cancelled: boolean
}
let inflight: Flight | null = null

function emit(next: Partial<Store>) {
  store = { ...store, ...next }
  for (const l of listeners) l()
}

async function poll() {
  if (inflight) return
  const flight: Flight = { ac: new AbortController(), cancelled: false }
  inflight = flight
  // A timeout aborts the request and is reported as a failure. stop() aborts
  // it too, but marks it cancelled first, and a cancelled poll says nothing.
  const giveUp = setTimeout(() => flight.ac.abort(), POLL_TIMEOUT_MS)
  try {
    const res = await fetch("/api/now", { cache: "no-store", signal: flight.ac.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = readSnapshot(await res.json())
    if (flight.cancelled) return
    if (!data) throw new Error("not a snapshot")
    const now = Date.now()
    const replayed = now - Date.parse(data.at) > REPLAY_AGE_MS
    const newest = !store.data || data.at >= store.data.at
    emit({ data: newest ? data : store.data, failed: replayed, askedAt: now })
  } catch {
    if (flight.cancelled) return
    emit({ failed: true, askedAt: Date.now() })
  } finally {
    clearTimeout(giveUp)
    if (inflight === flight) inflight = null
  }
}

function schedule(delayMs: number) {
  if (timer) clearTimeout(timer)
  const mine = ++generation
  timer = setTimeout(async () => {
    timer = null
    await poll()
    // While that poll was out, the last reader may have left and a new one
    // arrived (a client-side navigation), or the tab may have been hidden and
    // shown. Whoever did that has already scheduled the next question; this
    // callback must not replace an "ask now" with "ask in 15 s".
    if (mine !== generation) return
    if (listeners.size > 0 && document.visibilityState === "visible") schedule(NOW_POLL_MS)
  }, delayMs)
}

function onVisibility() {
  if (document.visibilityState !== "visible") {
    if (timer) clearTimeout(timer)
    timer = null
    generation++
    return
  }
  const due = store.askedAt + NOW_POLL_MS - Date.now()
  schedule(Math.max(0, due))
}

function start() {
  document.addEventListener("visibilitychange", onVisibility)
  // A server-rendered snapshot can be as old as the page's cache, so the first
  // question goes out straight away rather than a full interval later.
  if (document.visibilityState === "visible") schedule(0)
}

function stop() {
  document.removeEventListener("visibilitychange", onVisibility)
  if (timer) clearTimeout(timer)
  timer = null
  generation++
  if (inflight) {
    inflight.cancelled = true
    inflight.ac.abort()
    inflight = null
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1) start()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stop()
  }
}

const noSubscribe = () => () => {}

export interface LiveNow {
  data: NowSnapshot | null
  failed: boolean
}

export function useLiveNow(
  initial?: NowSnapshot | null,
  options?: { frozen?: boolean }
): LiveNow {
  const frozen = options?.frozen ?? false
  const seed = initial ?? null
  // The store's answer wins once it exists and is newer than what the server
  // rendered. ISO strings from one clock compare correctly as strings.
  const pick = (): NowSnapshot | null => {
    const live = store.data
    if (frozen || !live) return seed
    return seed && seed.at > live.at ? seed : live
  }
  const data = useSyncExternalStore(frozen ? noSubscribe : subscribe, pick, () => seed)
  const failed = useSyncExternalStore(
    frozen ? noSubscribe : subscribe,
    () => (frozen ? false : store.failed),
    () => false
  )
  return { data, failed }
}
