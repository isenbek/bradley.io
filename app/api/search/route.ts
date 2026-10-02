import { NextRequest } from "next/server"

/**
 * Site search: a thin proxy to the local vectl search service.
 *
 * The service (scripts/site-search/server.py, systemd unit
 * bradley-io-search) listens on 127.0.0.1 only. It embeds the query with
 * this box's own model (nomic-embed-text through Ollama) and searches a
 * vectl store of every page on the site, built by
 * scripts/site-search/index.py. Nothing leaves the machine.
 *
 * This route caps the query, rate-limits per visitor, and turns every
 * failure into a calm { ok: false, reason } so the search box can say what
 * happened instead of spinning.
 */

export const dynamic = "force-dynamic"

const UPSTREAM = process.env.SEARCH_UPSTREAM ?? "http://127.0.0.1:32295"
const MAX_Q = 200
const PER_MINUTE = 40

type Bucket = { start: number; n: number }
const buckets = new Map<string, Bucket>()

/** nginx sets X-Real-IP from the real client; a direct request has none. */
function clientIp(req: NextRequest): string {
  return req.headers.get("x-real-ip")?.trim() || "local"
}

function limited(ip: string): boolean {
  const now = Date.now()
  const b = buckets.get(ip)
  if (!b || now - b.start > 60_000) {
    buckets.set(ip, { start: now, n: 1 })
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now - v.start > 60_000) buckets.delete(k)
    }
    return false
  }
  b.n += 1
  return b.n > PER_MINUTE
}

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } })
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, MAX_Q)
  const kRaw = Number(req.nextUrl.searchParams.get("k") ?? "8")
  const k = Number.isFinite(kRaw) ? Math.min(Math.max(Math.trunc(kRaw), 1), 12) : 8
  if (q.length < 2) return reply({ ok: true, q, results: [] })
  if (limited(clientIp(req))) return reply({ ok: false, reason: "busy", results: [] }, 429)

  try {
    const url = `${UPSTREAM}/search?q=${encodeURIComponent(q)}&k=${k}`
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6_000) })
    if (!res.ok) return reply({ ok: false, reason: "unavailable", results: [] }, 503)
    const data = (await res.json()) as {
      ok?: boolean
      reason?: string
      results?: unknown[]
      index?: unknown
      ms?: number
    }
    if (!data || data.ok !== true || !Array.isArray(data.results)) {
      return reply({ ok: false, reason: data?.reason === "no-index" ? "no-index" : "unavailable", results: [] }, 503)
    }
    return reply({ ok: true, q, results: data.results, index: data.index ?? null, ms: data.ms ?? null })
  } catch {
    return reply({ ok: false, reason: "unavailable", results: [] }, 503)
  }
}
