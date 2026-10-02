import { visitorsSummary } from "@/components/live/now-snapshot"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * The visitors snapshot, reduced to what a front page can use.
 *
 * /api/visitors serves the collector's whole file, about 450 KB of places,
 * paths and networks, because /visitors draws all of it. A page that only
 * wants "how many knocks were turned away today" should not download that.
 * This answers with a dozen numbers (VisitorsSummary in
 * components/live/now-snapshot.ts): the snapshot's own time, the collector's
 * UTC day so far, the 30-day funnel, and the router's drop counters.
 *
 * It reads through the same handler /api/visitors uses, so there is one place
 * that knows where the snapshot lives, and it is parsed at most once a minute.
 * With no snapshot it answers 503, as /api/visitors does: a collector that has
 * never run is a visible state, not an empty-looking zero.
 */
export async function GET() {
  const summary = await visitorsSummary()
  if (!summary) {
    return Response.json({ error: "collector-offline" }, { status: 503 })
  }
  return Response.json(summary, {
    headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" },
  })
}
