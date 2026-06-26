import { promises as fs } from "fs"

const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"
const META = `${CACHE}/latest.json`

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const buf = await fs.readFile(META, "utf-8")
    return new Response(buf, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch {
    return Response.json({ error: "no frame yet" }, { status: 503 })
  }
}
