import { NextRequest } from "next/server"

const TRNG_UPSTREAM = "https://hotbits.tinymachines.ai"

export const dynamic = "force-dynamic"

// When the Geiger box last answered THIS process, so a failure can say since
// when. Memory only, on purpose: the unit's one writable path is .next, which
// deploy.sh swaps out on every deploy, so a file would be no more durable and
// would be one more thing to fail. After a restart it is null until the box
// answers, and the page words that honestly ("has not answered since this
// server started asking") rather than inventing a time.
const WATCHING_SINCE_ISO = new Date().toISOString()
let lastOkIso: string | null = null

const memory = () => ({ last_ok_iso: lastOkIso, watching_since_iso: WATCHING_SINCE_ISO })

/**
 * The paths this site reads that nginx hands to the Geiger box itself.
 *
 * hotbits.tinymachines.ai is one hostname with three things behind it, and
 * only one of them is the box (see the vhost in /etc/nginx/sites-enabled):
 *
 *   /v1/*                             a gateway process on THIS host (:8788)
 *   /random/{bytes,hex,integers,raw}  a fixed 410 that nginx writes by itself
 *   everything else                   the daemon on the Pi (trng.local:8000)
 *
 * The first two answer, in JSON, while the Pi is off the LAN. Counting either
 * as "the box answered" published a last-heard time for a box that had been
 * silent for days, and anyone could set it with one request to /v1/seeds. So
 * the memory is fed from an allow-list, not a deny-list: the daemon's own
 * status paths, which are the five the board polls. A path that is not listed
 * here still proxies through as before. It just proves nothing about the box.
 * If the vhost ever routes one of these somewhere else, change this list.
 */
const BOX_PATHS = new Set(["health", "stats", "metrics", "battery"])

/**
 * Would nginx route this URL to the box? Judged on the path as nginx sees it:
 * percent-decoded, dot segments resolved, repeated slashes merged. Without
 * that, "/health/../v1/seeds" (or its %2F spelling) starts with a listed name
 * and lands on the gateway. Anything that cannot be decoded is not the box.
 */
function reachesBox(target: string): boolean {
  let decoded: string
  try {
    decoded = decodeURIComponent(new URL(target).pathname)
  } catch {
    return false
  }
  const segs: string[] = []
  for (const seg of decoded.split("/")) {
    if (seg === "" || seg === ".") continue
    if (seg === "..") segs.pop()
    else segs.push(seg)
  }
  return segs.length > 0 && BOX_PATHS.has(segs[0])
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const search = req.nextUrl.search
  const target = `${TRNG_UPSTREAM}/${path.join("/")}${search}`

  // The status paths are small and answered from memory by the box, so a
  // healthy box replies in well under a second. Waiting 30 s for them left a
  // visitor looking at "CHECKING" for half a minute while the box was off the
  // LAN (nginx holds the connection about 14 s before its own 502). Give those
  // 5 s and say OFFLINE sooner; the heavy paths (random bytes, archives, long
  // metric windows) keep the long limit.
  const quick = path[0] === "health" || path[0] === "stats" || path.join("/") === "metrics/latest"
  try {
    const upstream = await fetch(target, {
      cache: "no-store",
      signal: AbortSignal.timeout(quick ? 5_000 : 30_000),
    })
    const contentType = upstream.headers.get("content-type") ?? "application/json"
    const isJson = contentType.includes("json")

    // When the box is off the LAN nginx still answers for it, with its own
    // HTML 502/504. That is the proxy talking, not the Geiger daemon, so it is
    // turned into the same JSON failure a refused connection gets.
    if (upstream.status >= 500 && !isJson) {
      return Response.json(
        {
          error: "upstream_unreachable",
          message: `gateway answered ${upstream.status} for the Geiger box`,
          upstream_status: upstream.status,
          ...memory(),
        },
        { status: 502, headers: { "cache-control": "no-store" } }
      )
    }

    // "Heard" means the daemon on the Pi answered, and only that. Two tests,
    // both required. The path is one nginx hands to the box (see BOX_PATHS).
    // And the answer is the daemon's: a 2xx, or one of its JSON errors (its 503
    // carries the health payload, and an unhealthy daemon is still a daemon
    // that answered). nginx's own error pages are HTML and do not count.
    if (reachesBox(target) && (upstream.ok || isJson)) {
      lastOkIso = new Date().toISOString()
    }

    // Read as bytes, not text(): /random/{bytes,raw,archive} are octet-streams
    // and text-decoding mangles them (wrong length, replacement chars). Bytes
    // pass JSON endpoints through unharmed too (content-type stays JSON).
    const buf = await upstream.arrayBuffer()
    const headers = new Headers({
      "content-type": contentType,
      "cache-control": "no-store",
    })
    // Forward geiger's informational headers (archive offset/size, conditioning).
    for (const h of ["x-geiger-conditioning", "x-geiger-archive", "x-archive-offset", "x-archive-size"]) {
      const v = upstream.headers.get(h)
      if (v) headers.set(h, v)
    }
    return new Response(buf, { status: upstream.status, headers })
  } catch (err) {
    return Response.json(
      { error: "upstream_fetch_failed", message: (err as Error).message, ...memory() },
      { status: 502, headers: { "cache-control": "no-store" } }
    )
  }
}
