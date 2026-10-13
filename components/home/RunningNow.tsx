"use client"

import { ActivityPulse } from "@/components/live/ActivityPulse"
import { NowPanel } from "@/components/live/NowPanel"
import type { NowId, NowSnapshot } from "@/components/live/types"
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
 * answering or are late (live, stale, or not yet asked). The silent ones are
 * not on the front door at all (owner's call, 2026-10-13: a month-old "last
 * heard" under the work is noise); /bench still names every one with the
 * date it was last heard.
 *
 * IT MOVES BY ITSELF. The split is taken from the newest snapshot the page's
 * one poll has (useLiveNow), so an instrument that starts answering again
 * appears in the panel within one poll, and one that falls silent leaves,
 * with no reload. The split depends on the snapshot alone, never on the
 * browser's clock, so the server and the first browser render agree.
 *
 * Between polls NowPanel still re-judges its rows on the reader's clock: a
 * stale row can show OFFLINE there for up to one poll before it leaves.
 * That is the panel being honest a few seconds early, not a contradiction.
 */

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
    </div>
  )
}
