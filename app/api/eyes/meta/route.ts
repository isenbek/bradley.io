import { promises as fs } from "fs"

const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"
const META = `${CACHE}/latest.json`

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * When each sense last WROTE something, as file mtimes in the cache dir.
 *
 * The meatball services publish by overwriting files here, and every route that
 * serves those files answers 200 for as long as the file exists, however old it
 * is. Unplug the cameras and the last frame is served for three weeks as if it
 * were now. The mtime is the one fact that says otherwise, and it costs a stat.
 *
 * camera, motion and ears are heartbeats: their services rewrite on a clock.
 * greeter, events and moments are logs: they only change when something
 * happens, so an old mtime there means "nothing happened", not "not running".
 * The boards judge liveness off the heartbeats only.
 */
const SENSES: Record<string, RegExp> = {
  camera: /^latest\.jpg$/,
  motion: /^delta-.+-latest\.json$/,
  ears: /^ears-.+\.json$/,
  greeter: /^greet-status\.json$/,
  events: /^events\.jsonl$/,
  moments: /^moments\.jsonl$/,
}

async function senses(): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  for (const k of Object.keys(SENSES)) out[k] = null
  let files: string[]
  try {
    files = await fs.readdir(CACHE)
  } catch {
    return out
  }
  const newest: Record<string, number> = {}
  for (const f of files) {
    for (const [k, re] of Object.entries(SENSES)) {
      if (!re.test(f)) continue
      try {
        const ms = (await fs.stat(`${CACHE}/${f}`)).mtimeMs
        if (!(k in newest) || ms > newest[k]) newest[k] = ms
      } catch {
        /* vanished between readdir and stat */
      }
    }
  }
  for (const [k, ms] of Object.entries(newest)) out[k] = new Date(ms).toISOString()
  return out
}

export async function GET() {
  const heard = await senses()
  try {
    const meta = JSON.parse(await fs.readFile(META, "utf-8")) as Record<string, unknown>
    // latest.json's own ts/epoch pass through untouched (EyesLive keys the frame
    // off epoch). frame_mtime is the JPEG's mtime, as a cross-check that does
    // not depend on the capture script having written the sidecar.
    return Response.json(
      { ...meta, frame_mtime: heard.camera, senses: heard },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    )
  } catch {
    return Response.json(
      { error: "no frame yet", senses: heard },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } }
    )
  }
}
