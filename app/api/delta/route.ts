import { promises as fs } from "fs"

// Serves the camera motion-delta data written by bradley-delta.service:
// the latest state (scalar + heatmap grid + bbox) and the ring-buffered
// time series. Same cache dir as the /eyes frames (/var/lib readable).
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const latest = JSON.parse(await fs.readFile(`${CACHE}/delta-latest.json`, "utf8"))
    let history: unknown[] = []
    try {
      const raw = await fs.readFile(`${CACHE}/delta-history.jsonl`, "utf8")
      history = raw
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l)
          } catch {
            return null
          }
        })
        .filter(Boolean)
    } catch {
      /* no history yet */
    }
    return Response.json({ latest, history }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json(
      { latest: null, history: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }
}
