"use client"

import Link from "next/link"
import { useNow } from "@/components/kit/InstrumentStatus"
import type { NowSnapshot } from "@/components/live/types"
import { useLiveNow } from "@/components/live/use-live-now"
import { lastHeardText, readInstrument, toMs } from "@/lib/instrument-status"
import { SITE_ROWS } from "./content"

/**
 * The status rows on the "This site and its instruments" card: one line per
 * instrument the card's own sentence names, each a link to its page.
 *
 *   <SiteRows initial={snapshot} />     snapshot from peekNow(), on the server
 *
 * WHY NOT FOUR LiveDots. The shared dot names things the way the "Running now"
 * panel does ("The perception bus", "The camera") and says only "is offline".
 * On this card the names have to match the sentence above them, and an
 * instrument that is off has one more true thing to say: when it was last
 * heard. So the rows are written here, from the same snapshot and the same
 * poll (useLiveNow: one request every 15 s, shared with every other reader on
 * the page), and the dot is the shared one's own class, unchanged.
 *
 * WHAT A ROW SAYS
 *   live      "live", and the dot fills. Blue is ACTIVE.
 *   stale     "stale, last heard 2 Oct 2026 17:44 UTC"
 *   offline   "offline, last heard 11 Sep 2026", or just "offline" when this
 *             server has never heard it
 *   no answer "not asked yet": the server rendered without waiting on a
 *             network instrument, and the first poll fills it in
 *
 * Absolute times only (lib/instrument-status.ts formats them in UTC by hand),
 * so the server and the browser print the same string and a cached line is
 * still true when it is read. No reading is printed here: a number belongs on
 * a panel, and each of these has one on its own page.
 *
 * THE CLOCK. The state is judged against FRESHNESS on the browser's clock, so
 * a row goes stale by itself if the poll stops. Before there is a browser
 * clock (the server render, the first client render, a reader without
 * JavaScript) it is judged at the moment the snapshot was assembled, which is
 * the server's own verdict. Both renders agree, so hydration does.
 *
 * Nothing moves. Hollow to filled is the whole signal, and the word is always
 * there, so the state does not depend on colour.
 */
export function SiteRows({ initial }: { initial?: NowSnapshot | null }) {
  const { data } = useLiveNow(initial)
  const clock = useNow()
  const now = clock ?? toMs(data?.at)

  return (
    <ul className="beta-about-rows" aria-label="Four of the instruments, right now">
      {SITE_ROWS.map(({ id, name, href }) => {
        const row = data?.rows.find((r) => r.id === id)
        let live = false
        let words = "not asked yet"
        if (row && row.status !== "checking" && row.freshness && now != null) {
          const r = readInstrument(row.freshness, {
            lastHeardMs: toMs(row.lastHeard),
            error: row.error,
            now,
          })
          live = r.state === "live"
          words =
            r.state === "live" || r.lastHeardMs == null
              ? r.state
              : `${r.state}, last heard ${lastHeardText(r.lastHeardMs, r.ageS)}`
        }
        return (
          <li key={id}>
            <span className="beta-live-dot" data-active={live ? "true" : "false"} aria-hidden="true" />
            <span className="beta-about-rows__text">
              <Link href={href}>{name}</Link>
              <span className="beta-about-rows__state">{words}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
