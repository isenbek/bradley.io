"use client"

import { useNow } from "@/components/kit/InstrumentStatus"
import { LiveDot } from "@/components/live/LiveDot"
import type { NowId, NowSnapshot } from "@/components/live/types"
import { useLiveNow } from "@/components/live/use-live-now"
import { readInstrument, toMs } from "@/lib/instrument-status"

/**
 * BenchDot: an instrument card's live dot, complete in the server's HTML.
 *
 *   const initial = await peekNow()     // in the page, server side
 *   <BenchDot of="geiger" initial={initial} />
 *
 * components/live LiveDot judges an instrument against the reader's clock, so
 * until a script runs it can only say "checking". That is honest and says
 * nothing. One state can be said earlier: an instrument the server's snapshot
 * already judged OFFLINE is still offline at any later moment, because a
 * silence only gets longer. So before this browser has a clock, a row that was
 * offline at the snapshot prints "is offline" with the hollow ring, in the
 * same markup and the same words LiveDot prints a moment later, so nothing
 * moves on hydration. Live and stale are not like that (they lapse) and wait
 * for the clock, exactly as LiveDot does. The same reasoning as BenchBoard's
 * offlineAtSnapshot.
 *
 * NAMES must match LiveDot's own (components/live/LiveDot.tsx, NAMES), or the
 * sentence would change under the reader when the clock arrives.
 */

const NAMES: Partial<Record<NowId, string>> = {
  firewall: "The edge firewall count",
  geiger: "The Geiger counter",
  bus: "The perception bus",
  cameras: "The camera",
  fleet: "The fleet collector",
}

export function BenchDot({ of, initial }: { of: NowId; initial?: NowSnapshot | null }) {
  const { data } = useLiveNow(initial)
  const now = useNow()

  if (now === null && data && NAMES[of]) {
    const row = data.rows.find((r) => r.id === of)
    const atMs = toMs(data.at)
    const offline =
      row != null &&
      row.status === "offline" &&
      row.freshness != null &&
      atMs != null &&
      readInstrument(row.freshness, {
        lastHeardMs: toMs(row.lastHeard),
        error: row.error,
        now: atMs,
      }).state === "offline"
    if (offline) {
      const words = `${NAMES[of]} is offline`
      return (
        <span className="beta-live-dotwrap" title={words}>
          <span className="beta-live-dot" data-active="false" aria-hidden="true" />
          <span className="beta-live-dotlabel">{words}</span>
        </span>
      )
    }
  }

  return <LiveDot of={of} label initial={initial} />
}
