import { getNow } from "@/components/live/now-snapshot"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * "Running now": one honest line per instrument, in one small answer.
 *
 * The home page polls this every 15 s. Everything it says is assembled in
 * components/live/now-snapshot.ts, which asks each instrument through the
 * route that already serves its board, waits at most about 2.5 s for any of
 * them, and keeps the assembled answer in memory for 10 s so a burst of
 * visitors is one fan-out to the hardware rather than one each.
 *
 * The shape is NowSnapshot in components/live/types.ts: `at`, `rows` (id,
 * label, href, value, unit, lastHeard, status, freshness, error, sentence) and
 * `pulse` (the last 24 hours of Claude Code activity on this host).
 *
 * It always answers 200. An instrument that is down is a row that says so, not
 * a failed request: the page asking has nothing better to show than the truth
 * about the rest.
 */
export async function GET() {
  const snapshot = await getNow()
  return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } })
}
