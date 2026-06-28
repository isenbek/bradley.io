import { promises as fs } from "fs"

// The exact frame the latest motion-delta grid corresponds to (so the heatmap
// overlay aligns). Written by bradley-delta.service to the eyes cache dir.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"
const FRAME = `${CACHE}/delta-frame.jpg`

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const buf = await fs.readFile(FRAME)
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    })
  } catch {
    return new Response("motion frame unavailable", { status: 503 })
  }
}
