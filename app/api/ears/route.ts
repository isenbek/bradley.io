import { promises as fs } from "fs"

// Per-mic listener status (baseline, level, FFT, state, last transcription) +
// the recent transcription feed, written by bradley-ears.service.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const files = await fs.readdir(CACHE)
    const names = files
      .map((f) => f.match(/^ears-(.+)\.json$/)?.[1])
      .filter((n): n is string => Boolean(n))
      .sort()

    const mics = []
    for (const name of names) {
      try {
        mics.push(JSON.parse(await fs.readFile(`${CACHE}/ears-${name}.json`, "utf8")))
      } catch {
        /* skip */
      }
    }

    let events: unknown[] = []
    try {
      const raw = await fs.readFile(`${CACHE}/ears-events.jsonl`, "utf8")
      events = raw
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
        .reverse()
    } catch {
      /* none yet */
    }

    return Response.json({ mics, events }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json({ mics: [], events: [] }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
