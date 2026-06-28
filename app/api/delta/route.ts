import { promises as fs } from "fs"

// Serves per-camera motion-delta data written by bradley-delta.service.
// Auto-discovers cameras from delta-<name>-latest.json files in the cache dir.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const files = await fs.readdir(CACHE)
    const names = files
      .map((f) => f.match(/^delta-(.+)-latest\.json$/)?.[1])
      .filter((n): n is string => Boolean(n))
      .sort()

    const cams = []
    for (const name of names) {
      try {
        const latest = JSON.parse(await fs.readFile(`${CACHE}/delta-${name}-latest.json`, "utf8"))
        let history: unknown[] = []
        try {
          const raw = await fs.readFile(`${CACHE}/delta-${name}-history.jsonl`, "utf8")
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
        cams.push({ name, latest, history })
      } catch {
        /* skip a half-written camera */
      }
    }
    return Response.json({ cams }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json({ cams: [] }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
