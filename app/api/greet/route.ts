import { promises as fs } from "fs"

// Meatball's "introduce yourself" presence probe, run by bradley-greet.service.
// GET  → current status + latest verdict.
// POST → drop a greet-request (a fresh nonce) for the watcher to pick up.
const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function readJson(name: string) {
  try {
    return JSON.parse(await fs.readFile(`${CACHE}/${name}`, "utf8"))
  } catch {
    return null
  }
}

export async function GET() {
  const [status, result] = await Promise.all([
    readJson("greet-status.json"),
    readJson("greet-result.json"),
  ])
  return Response.json({ status, result }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST() {
  // Don't start a new greeting while one is mid-flight.
  const status = await readJson("greet-status.json")
  if (status && (status.state === "speaking" || status.state === "listening")) {
    return Response.json(
      { ok: false, busy: true, state: status.state },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    )
  }
  const nonce = Date.now()
  try {
    await fs.writeFile(
      `${CACHE}/greet-request`,
      JSON.stringify({ nonce, ts: new Date().toISOString() }),
    )
  } catch (e) {
    return Response.json(
      { ok: false, error: String(e) },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
  return Response.json({ ok: true, nonce }, { headers: { "Cache-Control": "no-store" } })
}
