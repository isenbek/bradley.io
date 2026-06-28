import { promises as fs } from "fs"

// The brightened "subtracted" difference image for a camera (?cam=brio) —
// black where nothing changed, bright where it did. Written by bradley-delta.service.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  const cam = (new URL(req.url).searchParams.get("cam") || "brio").replace(/[^a-z0-9]/gi, "")
  try {
    const buf = await fs.readFile(`${CACHE}/delta-${cam}-diff.jpg`)
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    })
  } catch {
    return new Response("diff unavailable", { status: 503 })
  }
}
