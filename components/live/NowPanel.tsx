"use client"

import Link from "next/link"
import { DeployedAgo } from "@/components/kit/DeployedAgo"
import { InstrumentStatus, useNow, type InstrumentView } from "@/components/kit/InstrumentStatus"
import { readInstrument, statusLabel, toMs } from "@/lib/instrument-status"
import { useChanged } from "@/lib/use-changed"
import { Stamp } from "./Stamp"
import { NOW_POLL_MS, type NowRow, type NowSnapshot } from "./types"
import { useLiveNow } from "./use-live-now"

/**
 * NowPanel: "Running now", one row per instrument.
 *
 *   // in a server component
 *   const initial = await peekNow()          // components/live/now-snapshot
 *   <NowPanel initial={initial} />
 *
 * PROPS
 *   initial     NowSnapshot | null. The server's snapshot. It is rendered as
 *               is, complete, before any script runs: every row, its reading,
 *               and its last-heard time as an absolute date. Without it the
 *               panel shows a single "asking" line until the first poll.
 *   title       the panel-bar name. Default "Running now".
 *   sentences   show each instrument's one-line sentence under its name.
 *               Default true. False gives a tighter table: one line a row on a
 *               wide panel. Every reading carries its own period in its unit
 *               ("probes trapped since 00:00 UTC"), so the compact table still
 *               says what it counted; the sentence stays available as the
 *               reading's tooltip. With all eight rows and sentences on, the
 *               panel is long and reads like a log: a front page probably
 *               wants sentences={false}.
 *   only        a list of NowId to show, in the order /api/now gives them.
 *               Default: all of them.
 *   frozen      render `initial` and never poll. For specimens and tests.
 *
 * It renders a wrapper holding a kit .panel and, under it on paper, a
 * .measured chip naming the endpoint. Place it as a SIBLING of .prose.
 *
 * ALWAYS PASS `initial` ON A REAL PAGE. With it, the panel's height is the
 * same before and after hydration (the as-of line holds the room its age will
 * take, see ./Stamp). Without it the panel is one line tall until the first
 * poll and then grows by every row, pushing the page down.
 *
 * WHAT MOVES, AND WHY. The page asks /api/now every 15 s (not while the tab is
 * hidden). When a reading comes back different from the one on screen, that
 * one value takes the kit's settle wash and holds the kit's "changed" colour
 * for under a second. Nothing else moves: not on load, not on a poll that
 * brought the same numbers, not on a timer. The status tags are judged against
 * this browser's clock and tick by themselves, so an instrument that goes
 * quiet turns from LIVE to STALE in an open tab with no poll telling it to.
 *
 * OFFLINE IS CALM. An instrument that is not answering keeps its row, in muted
 * ink, with the kit's orange ATTENTION tag saying when it was last heard.
 * Never red, never hidden, and no reading: the last number a silent box gave
 * is not a reading of now. The one reading an offline row can carry (the bus
 * collector hearing a true zero) is printed in the same muted ink as "no
 * reading", so a bold number never sits beside an OFFLINE tag.
 */

/** One row, judged against this browser's clock. Null for the build, which has no freshness. */
function rowView(r: NowRow, now: number | null): InstrumentView | null {
  if (r.freshness == null) return null
  const lastHeardMs = toMs(r.lastHeard)
  const pending = r.status === "checking"
  return {
    instrument: r.freshness,
    pending,
    error: r.error,
    lastHeardMs,
    reading:
      now === null || pending
        ? null
        : readInstrument(r.freshness, { lastHeardMs, error: r.error, now }),
    now,
  }
}

/**
 * The tag of a row the server judged offline, before this browser has a clock.
 *
 * Without a clock InstrumentStatus prints only what is true whenever it is
 * read, which for most rows is "last heard" and a date. "Offline" is also such
 * a thing when the server found it so: a silence only gets longer, so an
 * instrument that was past its limit when the snapshot was taken is past it at
 * any later moment, unless it has spoken since, and then it is the snapshot
 * that is out of date (the foot prints its time). Live and stale are not like
 * that and stay unjudged until the clock arrives.
 *
 * So the row is judged once against the snapshot's own time and, if that says
 * offline, labelled with the same words the ticking tag will use a moment
 * later (statusLabel, lib/instrument-status.ts). Same words, same width: the
 * tag does not rewrap on hydration and the rows under it stay where they are.
 * No age is printed, only the state and an absolute date.
 */
function offlineAtSnapshot(r: NowRow, view: InstrumentView | null, atMs: number | null) {
  if (!view || view.now !== null || view.pending || atMs == null || r.status !== "offline") {
    return null
  }
  const reading = readInstrument(view.instrument, {
    lastHeardMs: view.lastHeardMs,
    error: r.error,
    now: atMs,
  })
  return reading.state === "offline" ? statusLabel(reading) : null
}

function Row({
  r,
  view,
  atMs,
  sentences,
}: {
  r: NowRow
  view: InstrumentView | null
  /** When the snapshot was assembled, epoch ms. */
  atMs: number | null
  sentences: boolean
}) {
  // The printed reading, so two polls that print the same do not flash.
  const shown = r.value == null ? null : `${r.value} ${r.unit ?? ""}`
  const changed = useChanged(shown)
  // Before there is a clock, the server's judgement stands in for the state
  // (it only mutes the row; the tag itself prints nothing it cannot stand by).
  const state = view?.reading?.state ?? r.status
  const offline = offlineAtSnapshot(r, view, atMs)

  return (
    // Each row is laid out as a grid (app/kit.css), and a table element with a
    // changed `display` can lose its table semantics in some browsers, so the
    // roles are stated rather than left to the element names.
    <tr role="row" data-state={state}>
      <td role="rowheader" className="beta-live-name">
        {r.href ? <Link href={r.href}>{r.label}</Link> : r.label}
      </td>
      <td role="cell" className="num beta-live-read" title={sentences ? undefined : r.sentence || undefined}>
        {r.value != null ? (
          <>
            <span className={changed ? "beta-live-val changed beta-live-settle" : "beta-live-val"}>
              {r.value}
            </span>
            {r.unit ? <span className="beta-live-unit"> {r.unit}</span> : null}
          </>
        ) : (
          <span className="beta-live-none">no reading</span>
        )}
      </td>
      <td role="cell" className="beta-live-tag">
        {offline ? (
          <span className="tag warn beta-inst" data-state="offline">
            {offline}
          </span>
        ) : view ? (
          <InstrumentStatus status={view} />
        ) : r.lastHeard ? (
          <span className="tag beta-inst" data-state="build">
            deployed <DeployedAgo iso={r.lastHeard} />
          </span>
        ) : null}
      </td>
      {sentences ? (
        <td role="cell" className="beta-live-say">
          {r.sentence}
        </td>
      ) : null}
    </tr>
  )
}

export function NowPanel({
  initial,
  title = "Running now",
  sentences = true,
  only,
  frozen = false,
}: {
  initial?: NowSnapshot | null
  title?: string
  sentences?: boolean
  only?: readonly NowRow["id"][]
  frozen?: boolean
}) {
  const { data, failed } = useLiveNow(initial, { frozen })
  const now = useNow()
  const rows = (data?.rows ?? []).filter((r) => !only || only.includes(r.id))

  // Counted only once there is a clock: "3 of 7 live" baked into cached HTML
  // would be a claim about a moment the reader is not in.
  const views = rows.map((r) => rowView(r, now))
  const atMs = toMs(data?.at)
  const instruments = views.filter((v) => v !== null)
  const live =
    now === null ? null : instruments.filter((v) => v.reading?.state === "live").length

  return (
    <div className="beta-live">
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar beta-inst-bar">
            <b>{title}</b>
            {/* Both wordings share one cell and one is shown, so the cell is
                as wide as the wider of the two before and after hydration and
                the bar cannot gain or lose a line when the count arrives. */}
            {instruments.length ? (
              <span className="beta-live-count">
                <span aria-hidden={live === null ? undefined : true}>
                  {instruments.length} instruments
                </span>
                <span aria-hidden={live === null ? true : undefined}>
                  {live ?? 0} of {instruments.length} live
                </span>
              </span>
            ) : null}
          </div>

          {rows.length ? (
            <table role="table" aria-label={title} className="readout beta-live-now">
              <tbody role="rowgroup">
                {rows.map((r, i) => (
                  <Row key={r.id} r={r} view={views[i]} atMs={atMs} sentences={sentences} />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="beta-inst-note">
              {data
                ? "The server answered, and its answer had none of these instruments in it."
                : failed
                  ? "This page could not reach the server to ask what is running."
                  : "Asking each instrument what it is doing."}
            </p>
          )}

          {data ? (
            <p className="beta-live-foot">
              {failed ? (
                <>
                  <b>The last poll got no fresh answer.</b> These readings are from{" "}
                </>
              ) : (
                "As of "
              )}
              <Stamp at={data.at} now={now}>
                {frozen
                  ? ". A fixed specimen: it does not ask again."
                  : `. Asks again every ${NOW_POLL_MS / 1000} s while this tab is visible.`}
              </Stamp>
            </p>
          ) : null}
        </div>
      </div>
      {/* One child, so the chip wraps as a sentence. .measured is a flex row,
          and a bare text node beside the <b> would wrap as a block of its own. */}
      <p className="measured">
        <span>
          <b>/api/now</b>: each row read from its own instrument, held 10 s on the server
        </span>
      </p>
    </div>
  )
}
