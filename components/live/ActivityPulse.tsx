"use client"

import { useEffect, useState } from "react"
import { BarStrip, type ChartTick, type StripDatum } from "@/app/_charts"
import { InstrumentStatus, useNow, type InstrumentView } from "@/components/kit/InstrumentStatus"
import { readInstrument, toMs } from "@/lib/instrument-status"
import { useChanged } from "@/lib/use-changed"
import { Stamp } from "./Stamp"
import type { NowSnapshot, Pulse } from "./types"
import { useLiveNow } from "./use-live-now"

/**
 * ActivityPulse: the last 24 hours of Claude Code activity on this host.
 *
 *   const initial = await peekNow()          // components/live/now-snapshot
 *   <ActivityPulse initial={initial} />
 *
 * A headline ("551 min active in the last 24 h"), one bar per clock hour, and
 * the time the count was written.
 *
 * PROPS
 *   initial   NowSnapshot | null. The server's snapshot; its `pulse` is drawn
 *             before any script runs. Share the same object you give NowPanel.
 *   framed    default true: a wrapper holding its own kit .panel (bar, status
 *             tag) and a .measured chip under it. Place that as a SIBLING of
 *             .prose. Pass false to get only the inside (headline, bars,
 *             as-of line) for composing into a .panel-face you already have;
 *             it must still sit on a panel, the bars are drawn for that ground.
 *   title     the panel-bar name when framed. Default "Claude Code, last 24 hours".
 *   frozen    render `initial` and never poll. For specimens and tests.
 *
 * It shares NowPanel's one poll of /api/now (useLiveNow), so putting both on a
 * page costs one request every 15 s, not two.
 *
 * WHAT THE BARS ARE. 25 of them: the 24 completed clock hours the cron's file
 * carries, plus the hour in progress, which the file holds in its total and
 * not in a bucket. A rolling 24-hour window touches 25 clock hours, so the
 * oldest and newest bars are part-hours and the 25 sum to the headline
 * exactly. The newest bar grows while the reader watches, a minute at a time,
 * and only when a session really is writing.
 *
 * THE HOURS ARE THE READER'S. The server cannot know the reader's timezone and
 * must not guess, so the first render labels the hours in UTC and says so. An
 * effect then relabels them in the reader's own zone and says that instead. A
 * post-hydration update is not a mismatch (components/kit/DeployedAgo.tsx).
 *
 * IT DOES NOT JUMP WHEN IT HYDRATES, given `initial`. The three things that
 * change after mount are built to keep their size: the caption swaps one word
 * for another, the as-of line holds the room for its age (./Stamp), and in a
 * narrow panel the status tag has a line of its own under the title in both
 * states, because "last heard <date>" and "LIVE" are not the same width.
 * Without `initial` the panel is one line until the first poll: pass it.
 *
 * THIS HOST ONLY. The file counts Claude Code sessions on this machine and not
 * on the second one, and says so itself (`covers`). The panel repeats it.
 */

const two = (n: number) => String(n).padStart(2, "0")
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** The hour a bar starts at, in UTC or in the reader's zone. */
function hourParts(iso: string, local: boolean) {
  const d = new Date(iso)
  return local
    ? { day: d.getDate(), month: d.getMonth(), hour: d.getHours(), minute: d.getMinutes() }
    : { day: d.getUTCDate(), month: d.getUTCMonth(), hour: d.getUTCHours(), minute: d.getUTCMinutes() }
}

function strip(pulse: Pulse, local: boolean) {
  const data: StripDatum[] = []
  const ticks: ChartTick[] = []
  pulse.bars.forEach((b, i) => {
    const p = hourParts(b.hour, local)
    const clock = `${two(p.hour)}:${two(p.minute)}`
    const note = !b.partial ? "" : i === pulse.bars.length - 1 ? ", hour in progress" : ", part hour"
    data.push({
      label: `${p.day} ${MONTHS[p.month]} ${clock}${local ? "" : " UTC"}${note}`,
      value: b.minutes,
    })
    // Every sixth hour of the clock, wherever those fall in the window.
    if (p.hour % 6 === 0) ticks.push({ at: i, label: clock })
  })
  return { data, ticks }
}

function PulseBody({
  pulse,
  now,
  fresh,
}: {
  pulse: Pulse
  now: number | null
  /** The file is current by this browser's clock, so its newest bar is "now". */
  fresh: boolean
}) {
  // False on the server and on the first client render; true after mount.
  const [local, setLocal] = useState(false)
  useEffect(() => setLocal(true), [])

  const total = pulse.total24h.toLocaleString("en-US")
  const changed = useChanged(total)
  const { data, ticks } = strip(pulse, local)
  const last = pulse.bars.length - 1

  return (
    <div className="beta-live-pulse">
      <p className="beta-live-headline">
        <span className={changed ? "beta-live-big changed beta-live-settle" : "beta-live-big"}>
          {total}
        </span>{" "}
        <span className="beta-live-headline__unit">min active in the last 24 h</span>
      </p>
      <p className="beta-live-sub">
        {pulse.thisHour} so far this hour, {pulse.lastHour} in the hour before. Claude Code
        sessions on this host only.
      </p>
      <BarStrip
        data={data}
        // One closing word either way, so relabelling after mount does not
        // change where the caption wraps.
        caption={`Active minutes per clock hour (${local ? "local" : "UTC"})`}
        summary={
          `${total} active minutes in the last 24 hours: ${pulse.thisHour} so far in the hour ` +
          `in progress and ${pulse.lastHour} in the hour before it.`
        }
        unit="min"
        ticks={ticks}
        highlight={fresh ? { index: last, label: "this hour" } : undefined}
      />
      <p className="beta-live-foot">
        Counted once a minute by a cron on this host. Last count{" "}
        <Stamp at={pulse.generated} now={now}>
          .
        </Stamp>
      </p>
    </div>
  )
}

export function ActivityPulse({
  initial,
  framed = true,
  title = "Claude Code, last 24 hours",
  frozen = false,
}: {
  initial?: NowSnapshot | null
  framed?: boolean
  title?: string
  frozen?: boolean
}) {
  const { data } = useLiveNow(initial, { frozen })
  const now = useNow()
  const pulse = data?.pulse ?? null
  const row = data?.rows?.find((r) => r.id === "activity") ?? null

  let view: InstrumentView | null = null
  if (row?.freshness) {
    const lastHeardMs = toMs(row.lastHeard)
    view = {
      instrument: row.freshness,
      pending: false,
      error: row.error,
      lastHeardMs,
      reading:
        now === null
          ? null
          : readInstrument(row.freshness, { lastHeardMs, error: row.error, now }),
      now,
    }
  }
  const fresh = view?.reading?.state === "live"

  const body = pulse ? (
    <PulseBody pulse={pulse} now={now} fresh={fresh} />
  ) : (
    <p className="beta-inst-note">
      {data
        ? "The activity file could not be read on this server, so there is no pulse to draw."
        : "Asking the server for the last 24 hours."}
    </p>
  )

  if (!framed) return body

  return (
    <div className="beta-live">
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar beta-inst-bar beta-live-pulsebar">
            <b>{title}</b>
            {view ? <InstrumentStatus status={view} /> : null}
          </div>
          {body}
        </div>
      </div>
      {/* One child, so the chip wraps as a sentence (see NowPanel). */}
      <p className="measured">
        <span>
          <b>public/data/activity-pulse.json</b>: rewritten every minute, this host only
        </span>
      </p>
    </div>
  )
}
