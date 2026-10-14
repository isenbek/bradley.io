/**
 * /api/fleet-up: how many Sysforge services are up right now, for beta.bradley.io's scene 4 ("one live number").
 *
 * Read from the Campaign Brain MCP server's mesh catalog (https://mcp.campaignbrain.dev/streamable, tool
 * `mesh_catalog`), with CBAUTH_API_KEY from this host's .env, which never leaves the server. A service counts as up
 * when it is registered on the mesh and its worker has sent a heartbeat in the last ten minutes. Cached in memory for
 * 60 seconds, so a burst of readers is one call. Never throws: a failure answers 503 with what it knows and when the
 * catalog last answered this process.
 */
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const MCP = "https://mcp.campaignbrain.dev/streamable"
const FRESH_S = 600
const CACHE_MS = 60_000

interface Service { id: string; mesh_registered?: boolean; heartbeat?: string | null }
interface Answer { at: string; up: number; registered: number; listed: number; freshSeconds: number; source: string }

const memo = globalThis as unknown as { __fleetUp?: { at: number; body: Answer }; __fleetUpOk?: string }

async function rpc(body: object, session?: string): Promise<{ text: string; session: string | null }> {
  const key = process.env.CBAUTH_API_KEY
  if (!key) throw new Error("no CBAUTH_API_KEY on this host")
  const r = await fetch(MCP, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(session ? { "mcp-session-id": session } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  })
  if (!r.ok) throw new Error(`mcp ${r.status}`)
  return { text: await r.text(), session: r.headers.get("mcp-session-id") }
}

/** The JSON-RPC result in a body that may be plain JSON or server-sent events. */
function result(text: string): unknown {
  const events = [...text.matchAll(/^data: (.*)$/gm)].map((m) => m[1])
  return JSON.parse(events.length ? events[events.length - 1] : text)
}

async function ask(): Promise<Answer> {
  const init = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "bradley.io", version: "1" } } })
  const session = init.session ?? undefined
  await rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, session)
  const call = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "mesh_catalog", arguments: {} } }, session)
  const body = result(call.text) as { result?: { content?: { text?: string }[] } }
  const text = body.result?.content?.[0]?.text
  if (!text) throw new Error("mesh_catalog answered without a catalog")
  const services = (JSON.parse(text) as { services: Service[] }).services
  const now = Date.now()
  const registered = services.filter((s) => s.mesh_registered)
  const up = registered.filter((s) => s.heartbeat && now - Date.parse(s.heartbeat) < FRESH_S * 1000)
  return { at: new Date(now).toISOString(), up: up.length, registered: registered.length, listed: services.length, freshSeconds: FRESH_S, source: "mcp.campaignbrain.dev mesh_catalog" }
}

export async function GET() {
  const hit = memo.__fleetUp
  if (hit && Date.now() - hit.at < CACHE_MS) return NextResponse.json(hit.body, { headers: { "cache-control": "no-store" } })
  try {
    const body = await ask()
    memo.__fleetUp = { at: Date.now(), body }
    memo.__fleetUpOk = body.at
    return NextResponse.json(body, { headers: { "cache-control": "no-store" } })
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e), lastOk: memo.__fleetUpOk ?? null }, { status: 503, headers: { "cache-control": "no-store" } })
  }
}
