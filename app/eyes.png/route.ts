import { promises as fs } from "fs"

// /eyes.png — the latest frame serialized as a real PNG (produced at capture
// time by scripts/cam-snap.sh). Same cache dir as the JPEG; ProtectSystem=strict
// leaves /var/lib readable.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"
const LATEST_PNG = `${CACHE}/latest.png`

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const buf = await fs.readFile(LATEST_PNG)
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    })
  } catch {
    return new Response("camera frame unavailable", { status: 503 })
  }
}
