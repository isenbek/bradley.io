"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  FRESHNESS,
  absDateTime,
  ageWords,
  lastHeardText,
  readInstrument,
  statusDetail,
  toMs,
  type InstrumentKey,
  type InstrumentReading,
} from "@/lib/instrument-status"

/**
 * The status of a live instrument, as a kit tag: LIVE, STALE or OFFLINE.
 *
 * Every instrument board puts one of these in its panel head, so the first
 * thing read is whether the numbers under it are happening now. The decision
 * and the thresholds are lib/instrument-status.ts; this file is only the clock
 * and the markup.
 *
 * THE CLOCK, and why it is state rather than Date.now() in render. Whether a
 * reading is fresh depends on when it is looked at, and the server looks once
 * and then serves that HTML for as long as the page is cached. So, exactly as
 * components/kit/DeployedAgo.tsx does it: the first render has no clock and
 * prints only what is true at any moment (an absolute date, or "checking"),
 * and an effect supplies the clock after mount. A post-hydration update is not
 * a mismatch; only a disagreeing first render is (React #418).
 *
 * Unlike DeployedAgo this one does tick. A footer reports the build of the
 * page being looked at and can sit still; an instrument that stops answering
 * has to go from LIVE to STALE in a tab that is simply left open, with no poll
 * succeeding to tell it so.
 *
 * COLOUR. LIVE takes blue, which is ACTIVE in this palette. STALE and OFFLINE
 * take the kit's "tag warn", orange, ATTENTION. Never red: red means an
 * assertion failed, and a box being unplugged is not one. The word carries the
 * state either way, so nothing here depends on telling orange from blue.
 */

/** Epoch ms, or null until mounted. Ticks so age-based states move by themselves. */
export function useNow(tickMs = 10_000): number | null {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, tickMs)
    return () => clearInterval(id)
  }, [tickMs])

  return now
}

export interface InstrumentView {
  instrument: InstrumentKey
  /** No answer of either kind yet: the first poll is still out. */
  pending: boolean
  /** The latest attempt to reach the instrument failed. */
  error: boolean
  lastHeardMs: number | null
  /** Null until there is both a clock and an answer. */
  reading: InstrumentReading | null
  /** The clock this view was judged against. Null on the server and first render. */
  now: number | null
}

/**
 * One instrument's status, judged against a ticking clock.
 *
 * `lastHeard` takes whatever the source has: epoch seconds, epoch ms, or an ISO
 * string. `error` means the last attempt to reach it failed. `pending` means
 * nothing has come back yet, which is neither live nor offline and is shown as
 * neither.
 */
export function useInstrument(
  instrument: InstrumentKey,
  input: {
    lastHeard: number | string | null | undefined
    error?: boolean
    pending?: boolean
    tickMs?: number
  }
): InstrumentView {
  const { lastHeard, error = false, pending = false, tickMs } = input
  const now = useNow(tickMs)
  const lastHeardMs = toMs(lastHeard)
  const reading =
    now === null || pending ? null : readInstrument(instrument, { lastHeardMs, error, now })
  return { instrument, pending, error, lastHeardMs, reading, now }
}

/** True only when the view has been judged and found live. */
export const isLive = (v: InstrumentView) => v.reading?.state === "live"

function thresholdTitle(key: InstrumentKey): string {
  const f = FRESHNESS[key]
  return `counts as stale after ${ageWords(f.staleAfterS)} of silence, offline after ${ageWords(f.offlineAfterS)}`
}

/** The tag. Goes in a panel-bar, right of the instrument's name. */
export function InstrumentStatus({ status }: { status: InstrumentView }) {
  const { reading, pending, error, lastHeardMs, instrument } = status

  // No clock yet (server render, first client render) or no answer yet. Only
  // things that are true whenever they are read may be printed here.
  if (!reading) {
    if (!pending && error) {
      return (
        <span className="tag warn beta-inst" data-state="offline">
          OFFLINE
          {lastHeardMs != null ? (
            <>
              {" · last heard "}
              <time dateTime={new Date(lastHeardMs).toISOString()}>{absDateTime(lastHeardMs)}</time>
            </>
          ) : (
            " · not answering"
          )}
        </span>
      )
    }
    if (!pending && lastHeardMs != null) {
      return (
        <span className="tag beta-inst" data-state="unjudged">
          {"last heard "}
          <time dateTime={new Date(lastHeardMs).toISOString()}>{absDateTime(lastHeardMs)}</time>
        </span>
      )
    }
    return (
      <span className="tag beta-inst" data-state="pending">
        checking
      </span>
    )
  }

  const word = reading.state.toUpperCase()
  const live = reading.state === "live"
  const iso = reading.lastHeardMs != null ? new Date(reading.lastHeardMs).toISOString() : undefined
  const title =
    (reading.lastHeardMs != null && reading.ageS != null
      ? `last heard ${absDateTime(reading.lastHeardMs)}, ${ageWords(reading.ageS)} ago; `
      : "") + thresholdTitle(instrument)

  // OFFLINE with a known last-heard prints the date inside a <time>, so the
  // machine-readable stamp travels with it. Every other detail is plain text.
  const dated = reading.state === "offline" && reading.lastHeardMs != null
  const detail = statusDetail(reading)

  return (
    <span
      className={`tag ${live ? "beta-inst--live" : "warn"} beta-inst`}
      data-state={reading.state}
      title={title}
    >
      {word}
      {dated && reading.lastHeardMs != null ? (
        <>
          {" · last heard "}
          <time dateTime={iso}>{lastHeardText(reading.lastHeardMs, reading.ageS)}</time>
        </>
      ) : detail ? (
        ` · ${detail}`
      ) : null}
    </span>
  )
}

/**
 * A moment, labelled. The absolute UTC time always; the relative age beside it
 * once there is a clock. Pass the view's `now` so both come off the same tick.
 */
export function When({
  at,
  now,
}: {
  at: number | string | null | undefined
  now: number | null
}) {
  const ms = toMs(at)
  if (ms == null) return <span>at an unknown time</span>
  return (
    <time dateTime={new Date(ms).toISOString()}>
      {absDateTime(ms)}
      {now != null ? ` (${ageWords((now - ms) / 1000)} ago)` : ""}
    </time>
  )
}

/** The sentence an instrument says about itself, inside its panel. */
export function InstrumentNote({ children }: { children: ReactNode }) {
  return <p className="beta-inst-note">{children}</p>
}

/**
 * A panel head for a board that is not itself a kit panel: the instrument's
 * name, its status tag, and whatever it has to say for itself underneath.
 * Boards that already have a panel put <InstrumentStatus> in their own
 * panel-bar instead.
 */
export function InstrumentHead({
  name,
  status,
  children,
}: {
  name: string
  status: InstrumentView
  children?: ReactNode
}) {
  return (
    <div className="panel beta-inst-panel">
      <div className="panel-face">
        <div className="panel-bar beta-inst-bar">
          <b>{name}</b>
          <InstrumentStatus status={status} />
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * What a proxy remembers about a silent upstream, as a sentence fragment.
 * Either when it last answered, or, if it never has, since when the server has
 * been asking, which is a floor on the silence and is worded as one.
 */
export function UpstreamSilence({
  status,
  watchingSinceMs,
  subject = "It",
}: {
  status: InstrumentView
  watchingSinceMs: number | null
  subject?: string
}) {
  if (status.lastHeardMs != null) {
    return (
      <>
        {subject} last answered <When at={status.lastHeardMs} now={status.now} />.
      </>
    )
  }
  if (watchingSinceMs != null) {
    return (
      <>
        {subject} has not answered since this server started asking, at{" "}
        <When at={watchingSinceMs} now={status.now} />, and may have been silent for longer than
        that.
      </>
    )
  }
  return null
}
