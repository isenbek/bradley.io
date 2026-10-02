import { NextRequest } from "next/server"

const SDR_UPSTREAM = "https://sdr.tinymachines.ai"

export const dynamic = "force-dynamic"

// When the control plane last answered THIS process, so a failure can say
// since when. Memory only: see the same note in app/api/trng/[...path]/route.ts
// (the unit's only writable path is swapped on every deploy). Null until the
// first answer after a restart, and the page says so rather than guessing.
const WATCHING_SINCE_ISO = new Date().toISOString()
let lastOkIso: string | null = null

const memory = () => ({ last_ok_iso: lastOkIso, watching_since_iso: WATCHING_SINCE_ISO })

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const search = req.nextUrl.search
  const target = `${SDR_UPSTREAM}/${path.join("/")}${search}`

  try {
    const upstream = await fetch(target, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    })
    const contentType = upstream.headers.get("content-type") ?? "application/json"
    const isJson = contentType.includes("json")

    // sdr.tinymachines.ai is nginx in front of bali. With bali unreachable
    // nginx answers for it with an HTML 502/504, which is the gateway talking
    // and is turned into the same JSON failure a refused connection gets.
    if (upstream.status >= 500 && !isJson) {
      return Response.json(
        {
          error: "upstream_unreachable",
          message: `gateway answered ${upstream.status} for the SDR control plane`,
          upstream_status: upstream.status,
          ...memory(),
        },
        { status: 502, headers: { "cache-control": "no-store" } }
      )
    }

    // "Answered" means the control plane itself did: a 2xx, or one of its JSON
    // errors. Every path on this vhost goes to bali, so the path needs no test
    // (unlike /api/trng), but nginx can still write an HTML 4xx by itself, and
    // that is not bali speaking.
    if (upstream.ok || isJson) lastOkIso = new Date().toISOString()

    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
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
