import { promises as fs } from "fs"

// The sensory event log written by bradley-seek.service (events.jsonl) —
// each motion detection qwen3-vl named, newest first.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const raw = await fs.readFile(`${CACHE}/events.jsonl`, "utf8")
    const events = raw
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
    return Response.json({ events }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json({ events: [] }, { headers: { "Cache-Control": "no-store" } })
  }
}
