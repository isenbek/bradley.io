// Client helpers for the worldsink fleet-health service (via the token-injecting
// /api/fleet proxy). worldsink is a second consumer of the WorldEvent bus that
// adds per-node health, attention/alerting, and an auto-medic on top.

export const FLEET_PROXY = "/api/fleet"

export interface NodeServices {
  drainer?: string
  mesh?: string
  bt?: string
  [k: string]: string | undefined
}

export interface NodeHealthData {
  node: string
  wifi_dbm?: number | null
  wifi_ssid?: string | null
  hci?: string
  disk_pct?: number
  temp_c?: number
  load1?: number
  uptime_s?: number
  backlog_bytes?: number
  spool_db_mb?: number
  uplink?: string
  services?: NodeServices
}

export interface FleetNode {
  host: string
  age_s: number
  stale: boolean
  data: NodeHealthData
}

export interface AttentionItem {
  node: string
  severity: "warn" | "crit" | string
  reasons: string[]
}

export interface MedicAction {
  node: string
  remedy: string
  acted: boolean
  armed: boolean
  detail: string
}

export interface WorldEnvelope<T = Record<string, unknown>> {
  schema?: string
  id?: string
  ts?: number
  host?: string
  type?: string
  data: T
  _recv?: number
}

export interface FleetState {
  now: string
  uptime_s: number
  last_recv_age_s: number
  counts: Record<string, number>
  drops?: Record<string, number>
  bytes_in: number
  node_stale_s?: number
  latest: Record<string, WorldEnvelope>
  nodes: Record<string, FleetNode>
  attention: AttentionItem[]
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${FLEET_PROXY}${path}`, { signal, cache: "no-store" })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export const getFleetState = (s?: AbortSignal) =>
  getJSON<FleetState>("/state.json", s)

// events.jsonl is a rolling last-100 buffer; medic.action is sporadic so this is
// often empty (fall back to state.latest["medic.action"]). Returns newest-last.
export async function getMedicEvents(
  s?: AbortSignal
): Promise<WorldEnvelope<MedicAction>[]> {
  const res = await fetch(`${FLEET_PROXY}/events.jsonl?type=medic.action`, {
    signal: s,
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`events.jsonl: ${res.status}`)
  const text = await res.text()
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as WorldEnvelope<MedicAction>
      } catch {
        return null
      }
    })
    .filter((e): e is WorldEnvelope<MedicAction> => e !== null)
}
