import { promises as fs } from "fs"

// Generic WorldEvent perception-bus snapshot, written every 1s by
// worldevent-collector.service (subscribes to the worldevent/1 UDP firehose on
// :31415). Type-agnostic — knows nothing about any specific producer.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const raw = await fs.readFile(`${CACHE}/worldevent.json`, "utf8")
    const snap = JSON.parse(raw)
    return Response.json(snap, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json(
      { offline: true, totals: { events: 0 }, types: [], hosts: [], tail: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
