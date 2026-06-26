import { promises as fs } from "fs"

// The snapshot timer (bradley-cam.timer) publishes the latest frame here.
// bradley-io.service runs ProtectSystem=strict, which leaves /var/lib readable.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"
const LATEST = `${CACHE}/latest.jpg`

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const buf = await fs.readFile(LATEST)
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    })
  } catch {
    return new Response("camera frame unavailable", { status: 503 })
  }
}
