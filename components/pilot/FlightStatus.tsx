"use client"

import { LiveDot, useActive } from "@/components/live/LiveDot"
import type { NowSnapshot } from "@/components/live/types"

/**
 * FlightStatus: the right-hand end of the licence's panel-bar.
 *
 *   <div className="panel-bar beta-inst-bar">
 *     <b>AI pilot licence</b>
 *     <FlightStatus initial={snapshot} />
 *   </div>
 *
 * When a Claude Code session on this host is KNOWN to have written to its log
 * in the last five minutes (useActive, components/live/LiveDot.tsx), the bar
 * carries an "IN FLIGHT" tag in ACTIVE blue beside a lit dot. Otherwise it
 * carries a hollow dot and a plain sentence. Nothing here is lit by a timer or
 * by a guess: the tag appears only on proof, and goes out by itself when the
 * proof is more than five minutes old on the reader's own clock.
 *
 * WHAT IT DOES NOT CLAIM. The pulse file counts sessions on this host only,
 * and most of the record was flown from a second machine. So the unlit state
 * says "none seen from this host", never "on the ground".
 *
 * The state is carried three ways, so it survives greyscale and a screen
 * reader: the dot is filled or hollow, the words differ, and the dot's own
 * hidden sentence says which.
 *
 * PROPS
 *   initial   the server's NowSnapshot (peekNow), or null. With it the first
 *             paint already has the dot; the words still wait for a clock.
 *
 * It shares the page's one poll of /api/now with ActivityPulse.
 */
export function FlightStatus({ initial }: { initial: NowSnapshot | null }) {
  const { active, known, words } = useActive("activity", initial)

  return (
    <span className="beta-pilot-flight" title={words}>
      <LiveDot initial={initial} />
      {active ? (
        <span className="tag beta-inst beta-inst--live" data-state="live">
          In flight
        </span>
      ) : (
        <span className="beta-pilot-flight__idle">
          {known ? "no session seen from this host" : "checking"}
        </span>
      )}
    </span>
  )
}
