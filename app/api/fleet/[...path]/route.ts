import { NextRequest } from "next/server"

// Same-origin proxy for the worldsink fleet-health service on bali. The upstream
// is bearer-auth'd and LAN-only, so we inject the token server-side (never shipped
// to the browser) and forward the JSON/JSONL response verbatim.
//
// Config via env (kept out of the repo, see /etc/bradley-io.env):
//   WORLDSINK_TOKEN     bearer token for worldsink
//   WORLDSINK_UPSTREAM  base URL (default the bali IP; bali.lan doesn't resolve here)
const UPSTREAM = process.env.WORLDSINK_UPSTREAM ?? "http://192.168.1.176:8087"
const TOKEN = process.env.WORLDSINK_TOKEN ?? ""

export const dynamic = "force-dynamic"

// When worldsink last answered THIS process, so a failure can say since when.
// Memory only: see the same note in app/api/trng/[...path]/route.ts (the unit's
// only writable path is swapped on every deploy). Null until the first answer
// after a restart, and the page says so rather than guessing.
const WATCHING_SINCE_ISO = new Date().toISOString()
let lastOkIso: string | null = null

const memory = () => ({ last_ok_iso: lastOkIso, watching_since_iso: WATCHING_SINCE_ISO })

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const search = req.nextUrl.search
  const target = `${UPSTREAM}/${path.join("/")}${search}`

  if (!TOKEN) {
    return Response.json(
      { error: "worldsink_unconfigured", message: "WORLDSINK_TOKEN is not set", ...memory() },
      { status: 503 }
    )
  }

  try {
    const upstream = await fetch(target, {
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(15_000),
    })
    // No gateway in between here: any HTTP answer at all is worldsink itself.
    lastOkIso = new Date().toISOString()
    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    })
  } catch (err) {
    return Response.json(
      { error: "upstream_fetch_failed", message: (err as Error).message, ...memory() },
      { status: 502, headers: { "cache-control": "no-store" } }
    )
  }
}
