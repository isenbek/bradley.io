import { promises as fs } from "fs"

// The multimodal moment timeline (motion + speech, each with before/during/after
// scenes + cross-modal correlation), written by bradley-moments.service.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const raw = await fs.readFile(`${CACHE}/moments.jsonl`, "utf8")
    const moments = raw
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
    return Response.json({ moments }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json({ moments: [] }, { headers: { "Cache-Control": "no-store" } })
  }
}
