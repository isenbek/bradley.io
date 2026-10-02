"use client"

import Link from "next/link"
import { ActivityPulse } from "@/components/live/ActivityPulse"
import { NowPanel } from "@/components/live/NowPanel"
import type { NowId, NowRow, NowSnapshot } from "@/components/live/types"
import { useLiveNow } from "@/components/live/use-live-now"

/**
 * RunningNow: the front page's live block. The instruments that are
 * answering, the ones that are not, and the Claude Code pulse.
 *
 *   const initial = await peekNow()            // components/live/now-snapshot
 *   <RunningNow initial={initial} ids={["activity", "firewall", ...]} />
 *
 * PROPS
 *   initial   the page's one /api/now snapshot. Given to every reader, so the
 *             server's HTML is the whole block at its final height.
 *   ids       the instruments to account for, in display order.
 *
 * WHY THE SPLIT. NowPanel lists every instrument it is given, and an offline
 * one keeps a full row with an orange tag (right on /bench, where the point is
 * the roll call). On the front door, with most of the hardware unplugged,
 * that was five orange rows and more than a phone screen of "not answering"
 * before any work appeared. So the panel gets only the instruments that are
 * answering or are late (live, stale, or not yet asked), and the silent ones
 * are named once, in a slim panel under it, with the date each was last heard
 * where there is one. Nothing is hidden: every instrument is on the page, in
 * one of the two places.
 *
 * IT MOVES BY ITSELF. The split is taken from the newest snapshot the page's
 * one poll has (useLiveNow), so an instrument that starts answering again
 * moves back into the panel within one poll, and one that falls silent moves
 * out, with no reload. The split depends on the snapshot alone, never on the
 * browser's clock, so the server and the first browser render agree.
 *
 * Between polls NowPanel still re-judges its rows on the reader's clock: a
 * stale row can show OFFLINE there for up to one poll before it moves down.
 * That is the panel being honest a few seconds early, not a contradiction.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-09-29T20:56:26Z" as "29 Sep 2026", sliced from the string (UTC). */
function heardOn(iso: string | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "")
  if (!m) return null
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : null
}

function Quiet({ rows, of }: { rows: NowRow[]; of: number }) {
  const n = rows.length
  return (
    <div className="panel beta-home-quiet">
      <div className="panel-face">
        <div className="panel-bar beta-inst-bar">
          <b>Not answering</b>
          <span className="tag warn">
            {n} of {of} offline
          </span>
        </div>
        <ul className="beta-home-quiet__list">
          {rows.map((r) => {
            const when = heardOn(r.lastHeard)
            return (
              <li key={r.id} title={r.sentence || undefined}>
                {r.href ? (
                  <Link className="beta-home-onpanel" href={r.href}>
                    {r.label}
                  </Link>
                ) : (
                  <span>{r.label}</span>
                )}
                <span className="beta-home-quiet__when">
                  {when ? `last heard ${when}` : "not heard"}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="beta-live-foot">
          From the same /api/now answer. Each returns to Running now by itself when it answers.{" "}
          <Link className="beta-home-onpanel" href="/bench">
            The bench
          </Link> lists every live page on this server.
        </p>
      </div>
    </div>
  )
}

export function RunningNow({ initial, ids }: { initial: NowSnapshot | null; ids: readonly NowId[] }) {
  const { data } = useLiveNow(initial)
  const rows = (data?.rows ?? []).filter((r) => ids.includes(r.id))
  const quiet = rows.filter((r) => r.status === "offline")
  const answering = ids.filter((id) => !quiet.some((q) => q.id === id))

  return (
    <div className="beta-home-now">
      {answering.length ? (
        <div className="beta-home-now__rows">
          <NowPanel initial={initial} sentences={false} only={answering} />
        </div>
      ) : null}
      <div className="beta-home-now__pulse">
        <ActivityPulse initial={initial} />
      </div>
      {quiet.length ? <Quiet rows={quiet} of={rows.length} /> : null}
    </div>
  )
}
