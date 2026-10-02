"use client"

import Link from "next/link"
import { DeployedAgo } from "@/components/kit/DeployedAgo"
import { InstrumentStatus, useNow, type InstrumentView } from "@/components/kit/InstrumentStatus"
import { Stamp } from "@/components/live/Stamp"
import { NOW_POLL_MS, type NowId, type NowRow, type NowSnapshot } from "@/components/live/types"
import { useLiveNow } from "@/components/live/use-live-now"
import { readInstrument, statusLabel, toMs } from "@/lib/instrument-status"
import { useChanged } from "@/lib/use-changed"

/**
 * BenchBoard: every instrument on this server, whether it is answering, and
 * the pages that read it.
 *
 *   // in a server component
 *   const initial = await peekNow()          // components/live/now-snapshot
 *   <BenchBoard initial={initial} instruments={INSTRUMENTS} />
 *
 * PROPS
 *   initial       NowSnapshot | null, the server's snapshot. Rendered as is,
 *                 complete, before any script runs.
 *   instruments   BenchInstrument[]: for each row of /api/now, the name to
 *                 print, the pages on this site that read that instrument, and
 *                 an optional note about what the tag does and does not cover.
 *                 Listed in the order given.
 *
 * It is the same snapshot, the same poll and the same judgement as
 * components/live/NowPanel (useLiveNow, readInstrument against the reader's
 * own clock), arranged for a different question. NowPanel asks "what is each
 * instrument reading"; this asks "is it up, and where is it". So the status
 * tag leads and the pages hang under it.
 *
 * ONE TAG PER INSTRUMENT, NOT PER PAGE. /api/now has one row for the camera
 * and four pages draw from it. Printing the same OFFLINE tag four times would
 * say less, more loudly. Where a page also judges something the snapshot does
 * not carry (the airspace map and its own receiver), the note says so.
 *
 * A PAGE IS NOT ITS INSTRUMENT. When an instrument is offline its name steps
 * back to muted ink, and the links under it do not: the page is still there,
 * and will say for itself that its instrument has stopped.
 *
 * Everything NowPanel promises holds here because it is the same machinery:
 * no reading beside an OFFLINE tag, orange and never red for a box that is
 * unplugged, a value that flashes only when it really changed, and nothing
 * that moves because time passed. Renders a kit .panel and a .measured chip:
 * place it as a SIBLING of .prose.
 */

export interface BenchPage {
  href: string
  name: string
  blurb: string
}

export interface BenchInstrument {
  id: NowId
  /** What the thing being judged is, in plain words. */
  name: string
  pages: BenchPage[]
  /** What the tag does not cover, when a page under it judges something else too. */
  note?: string
}

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
 * The tag of a row the server judged offline, before this browser has a
 * clock. A silence only gets longer, so "offline at the snapshot" is true at
 * any later reading; live and stale are not like that and wait for the clock.
 * Same words the ticking tag prints a moment later, so nothing rewraps on
 * hydration. (The reasoning in full is in components/live/NowPanel.tsx.)
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

function Block({
  inst,
  row,
  view,
  atMs,
}: {
  inst: BenchInstrument
  row: NowRow | undefined
  view: InstrumentView | null
  atMs: number | null
}) {
  // The printed reading, so two polls that print the same do not flash.
  const shown = row?.value == null ? null : `${row.value} ${row.unit ?? ""}`
  const changed = useChanged(shown)
  const state = view?.reading?.state ?? row?.status ?? "checking"
  const offline = row ? offlineAtSnapshot(row, view, atMs) : null

  return (
    <li data-state={state}>
      <div className="beta-bench-inst__head">
        <h3 className="beta-bench-inst__name">{inst.name}</h3>
        <span className="beta-bench-inst__read">
          {row?.value != null ? (
            <>
              <span className={changed ? "beta-live-val changed beta-live-settle" : "beta-live-val"}>
                {row.value}
              </span>
              {row.unit ? <span className="beta-live-unit"> {row.unit}</span> : null}
            </>
          ) : row ? (
            <span className="beta-live-none">no reading</span>
          ) : null}
        </span>
        <span className="beta-bench-inst__tag">
          {!row ? (
            <span className="tag beta-inst" data-state="pending">
              not in this answer
            </span>
          ) : offline ? (
            <span className="tag warn beta-inst" data-state="offline">
              {offline}
            </span>
          ) : view ? (
            <InstrumentStatus status={view} />
          ) : row.lastHeard ? (
            <span className="tag beta-inst" data-state="build">
              deployed <DeployedAgo iso={row.lastHeard} />
            </span>
          ) : null}
        </span>
      </div>

      {row?.sentence ? <p className="beta-bench-inst__say">{row.sentence}</p> : null}

      {inst.pages.length ? (
        <ul className="beta-bench-pages">
          {inst.pages.map((p) => (
            <li key={p.href}>
              <span className="beta-bench-pages__door">
                <Link href={p.href}>{p.name}</Link> <span className="beta-bench-path">{p.href}</span>
              </span>
              <span className="beta-bench-pages__blurb">{p.blurb}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {inst.note ? <p className="beta-bench-inst__note">{inst.note}</p> : null}
    </li>
  )
}

export function BenchBoard({
  initial,
  instruments,
}: {
  initial?: NowSnapshot | null
  instruments: BenchInstrument[]
}) {
  const { data, failed } = useLiveNow(initial)
  const now = useNow()
  const atMs = toMs(data?.at)

  const rows = instruments.map((inst) => data?.rows.find((r) => r.id === inst.id))
  const views = rows.map((r) => (r ? rowView(r, now) : null))
  // Counted only once there is a clock: "2 of 7 live" baked into cached HTML
  // would be a claim about a moment the reader is not in.
  const judged = views.filter((v) => v !== null)
  const live = now === null ? null : judged.filter((v) => v.reading?.state === "live").length

  return (
    <div className="beta-live beta-bench-board">
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar beta-inst-bar">
            <b>Instruments</b>
            {/* Both wordings share one cell and one is shown, so the bar is the
                same width before and after the count arrives (beta-live-count). */}
            {judged.length ? (
              <span className="beta-live-count">
                <span aria-hidden={live === null ? undefined : true}>
                  {judged.length} instruments
                </span>
                <span aria-hidden={live === null ? true : undefined}>
                  {live ?? 0} of {judged.length} live
                </span>
              </span>
            ) : null}
          </div>

          <ul className="beta-bench-inst">
            {instruments.map((inst, i) => (
              <Block key={inst.id} inst={inst} row={rows[i]} view={views[i]} atMs={atMs} />
            ))}
          </ul>

          <p className="beta-live-foot">
            {data ? (
              <>
                {failed ? (
                  <>
                    <b>The last poll got no fresh answer.</b> These tags are from{" "}
                  </>
                ) : (
                  "As of "
                )}
                <Stamp at={data.at} now={now}>
                  {`. Asks again every ${NOW_POLL_MS / 1000} s while this tab is visible.`}
                </Stamp>
              </>
            ) : failed ? (
              "This page could not reach the server to ask what is running."
            ) : (
              "Asking each instrument whether it is there."
            )}
          </p>
        </div>
      </div>
      {/* One child, so the chip wraps as a sentence (see .beta-live > .measured). */}
      <p className="measured">
        <span>
          <b>/api/now</b>: each instrument asked by this server, judged against how often it is
          supposed to speak
        </span>
      </p>
    </div>
  )
}
