import { promises as fs } from "fs"

// Serves a saved crop thumbnail for an event (?f=<epoch>-<cam>.jpg), written
// by bradley-seek.service into the events/ subdir. Filename is sanitized.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  const f = (new URL(req.url).searchParams.get("f") || "").replace(/[^a-z0-9.-]/gi, "")
  if (!f.endsWith(".jpg") || f.includes("..")) {
    return new Response("bad request", { status: 400 })
  }
  try {
    const buf = await fs.readFile(`${CACHE}/events/${f}`)
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
    })
  } catch {
    return new Response("not found", { status: 404 })
  }
}
