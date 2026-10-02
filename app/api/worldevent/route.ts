import { promises as fs } from "fs"

// Generic WorldEvent perception-bus snapshot, written every 1s by
// worldevent-collector.service (subscribes to the worldevent/1 UDP firehose on
// :31415). Type-agnostic: knows nothing about any specific producer.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"
const SNAPSHOT = `${CACHE}/worldevent.json`

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Two different things can go quiet here and the snapshot alone hides both.
 *
 *  - The PRODUCERS stop. The collector keeps rewriting the file every second
 *    with eventsPerSec 0, and the route keeps answering 200.
 *  - The COLLECTOR stops. The file stays on disk with its last ageSec values
 *    frozen at "2 s ago", and the route still answers 200.
 *
 * So the route adds the two absolute times that tell them apart: lastEventAt,
 * the newest event of any schema (when a producer was last heard), and
 * snapshotAt, the file's mtime (when the collector last wrote). Both are added
 * fields; the snapshot itself passes through unchanged.
 */
export async function GET() {
  try {
    const [raw, st] = await Promise.all([fs.readFile(SNAPSHOT, "utf8"), fs.stat(SNAPSHOT)])
    const snap = JSON.parse(raw) as { types?: { lastTs?: unknown }[] }
    let newest = 0
    for (const t of Array.isArray(snap.types) ? snap.types : []) {
      if (typeof t?.lastTs === "number" && t.lastTs > newest) newest = t.lastTs
    }
    return Response.json(
      {
        ...snap,
        lastEventAt: newest > 0 ? new Date(newest * 1000).toISOString() : null,
        snapshotAt: st.mtime.toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return Response.json(
      {
        offline: true,
        totals: { events: 0 },
        types: [],
        hosts: [],
        tail: [],
        lastEventAt: null,
        snapshotAt: null,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }
}
