import {
  INVALID_REQUEST,
  PARSE_ERROR,
  SUPPORTED_VERSIONS,
  describe,
  handleMessage,
  rpcError,
  type RpcResponse,
} from "@/lib/resume-mcp"

/**
 * /api/resume/mcp: the resume as a Model Context Protocol server.
 *
 * Streamable HTTP, stateless, read-only. The protocol lives in
 * lib/resume-mcp.ts; this file is the HTTP edge: rate limit, body cap, CORS,
 * and turning whatever arrives into JSON-RPC answers without ever throwing.
 */

export const dynamic = "force-dynamic"

const MAX_BODY = 64 * 1024 // bytes; the largest honest request is a few hundred
const MAX_BATCH = 20
const WINDOW_MS = 60_000
const PER_WINDOW = 60 // requests per IP per minute
const MAX_TRACKED = 5_000

// Memory only, per process. Cheap on purpose: it stops a loop, not an army.
// Insertion order is window-start order (a new window re-inserts its key), so
// the first keys in the map are always the oldest.
const hits = new Map<string, { start: number; n: number }>()

function limited(key: string): number {
  const now = Date.now()
  if (hits.size >= MAX_TRACKED) {
    for (const [k, v] of hits) {
      if (now - v.start < WINDOW_MS) break // everything after this is newer
      hits.delete(k)
    }
    // Still full of live windows: drop the oldest tenth of the clients that
    // are under the limit. Never clear the map, and never forget a client
    // that is being limited, or a flood of new addresses would free it.
    if (hits.size >= MAX_TRACKED) {
      let drop = Math.ceil(MAX_TRACKED / 10)
      for (const [k, v] of hits) {
        if (drop <= 0) break
        if (v.n > PER_WINDOW) continue
        hits.delete(k)
        drop -= 1
      }
      // Hard ceiling on memory if thousands of clients are all being limited.
      for (const k of hits.keys()) {
        if (hits.size < MAX_TRACKED * 2) break
        hits.delete(k)
      }
    }
  }
  const h = hits.get(key)
  if (!h || now - h.start >= WINDOW_MS) {
    hits.delete(key)
    hits.set(key, { start: now, n: 1 })
    return 0
  }
  h.n += 1
  return h.n > PER_WINDOW ? Math.ceil((h.start + WINDOW_MS - now) / 1000) : 0
}

/**
 * The key a client is counted under. IPv4 is the address. IPv6 is its /64,
 * because one host routinely holds a whole /64 and could otherwise rotate
 * addresses past the limit.
 */
function limitKey(ip: string): string {
  const s = ip.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "")
  if (!s.includes(":")) return s.slice(0, 64) || "unknown"
  const mapped = s.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return mapped[1]
  const [head, tail] = s.includes("::") ? s.split("::", 2) : [s, undefined]
  const left = head ? head.split(":") : []
  const right = tail ? tail.split(":") : []
  const groups =
    tail === undefined ? left : [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right]
  const prefix = groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "") || "0").join(":")
  return `${prefix.slice(0, 40)}::/64` // a spoofed header cannot grow the key
}

/** nginx sets X-Real-IP to the peer address; X-Forwarded-For's first hop is client-supplied. */
function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim()
  if (real) return real
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",").pop()!.trim() || "unknown"
  return "unknown"
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "Mcp-Protocol-Version",
}

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS, ...extra },
  })

/** Read at most MAX_BODY bytes; null when the body is larger. */
async function readCapped(req: Request): Promise<string | null> {
  const declared = Number(req.headers.get("content-length"))
  if (Number.isFinite(declared) && declared > MAX_BODY) return null
  if (!req.body) return ""
  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BODY) {
      reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  const buf = new Uint8Array(size)
  let off = 0
  for (const c of chunks) {
    buf.set(c, off)
    off += c.byteLength
  }
  return new TextDecoder().decode(buf)
}

export async function POST(req: Request) {
  try {
    const wait = limited(limitKey(clientIp(req)))
    if (wait > 0)
      return json(rpcError(null, -32000, `rate limited: try again in ${wait} s`), 429, { "Retry-After": String(wait) })

    const version = req.headers.get("mcp-protocol-version")
    if (version && !SUPPORTED_VERSIONS.includes(version))
      return json(
        rpcError(null, INVALID_REQUEST, `unsupported MCP-Protocol-Version: ${version.slice(0, 40)}`, {
          supported: SUPPORTED_VERSIONS,
        }),
        400
      )

    const text = await readCapped(req)
    if (text === null) return json(rpcError(null, INVALID_REQUEST, `request body over ${MAX_BODY} bytes`), 413)

    let msg: unknown
    try {
      msg = JSON.parse(text)
    } catch {
      return json(rpcError(null, PARSE_ERROR, "parse error: the body is not valid JSON"), 400)
    }

    if (Array.isArray(msg)) {
      if (msg.length === 0) return json(rpcError(null, INVALID_REQUEST, "empty batch"), 400)
      if (msg.length > MAX_BATCH)
        return json(rpcError(null, INVALID_REQUEST, `batch of ${msg.length}; at most ${MAX_BATCH}`), 400)
      const out = msg.map(handleMessage).filter((r): r is RpcResponse => r !== null)
      return out.length ? json(out) : new Response(null, { status: 202, headers: CORS })
    }

    const res = handleMessage(msg)
    if (!res) return new Response(null, { status: 202, headers: CORS })
    // A message we could not even attribute to a request id was not accepted:
    // the transport spec asks for an HTTP error status alongside the body.
    return json(res, res.error && res.id === null ? 400 : 200)
  } catch {
    // Belt and braces: nothing above should throw, and a client still gets JSON-RPC if it does.
    return json(rpcError(null, -32603, "internal error"), 500)
  }
}

export function GET(req: Request) {
  // A Streamable HTTP client opens an event stream with GET. This server
  // offers none, and the spec's answer for that is 405.
  const accept = req.headers.get("accept") ?? ""
  if (accept.includes("text/event-stream") && !accept.includes("text/html"))
    return new Response("This server does not offer an event stream. POST JSON-RPC instead.\n", {
      status: 405,
      headers: {
        Allow: "POST, GET, OPTIONS",
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        Vary: "Accept",
        ...CORS,
      },
    })
  return new Response(describe(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      // The same URL answers 405 to an event-stream GET; a shared cache must
      // not hand this description to one.
      Vary: "Accept",
      ...CORS,
    },
  })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Max-Age": "86400" } })
}

export function DELETE() {
  // No sessions, so nothing to end.
  return new Response(null, { status: 405, headers: { Allow: "POST, GET, OPTIONS", ...CORS } })
}
