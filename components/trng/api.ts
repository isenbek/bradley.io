// Browser → same-origin proxy at /api/trng (server forwards to hotbits.tinymachines.ai).
// Avoids CORS; upstream has no Access-Control-Allow-Origin header.
export const TRNG_API = "/api/trng"

export interface HealthResponse {
  healthy: boolean
  logger_service_active: boolean
  events_csv_age_s: number
  events_csv_fresh: boolean
  pool_fresh_bytes: number
  pool_has_bytes: boolean
}

export interface StatsResponse {
  bits_bin: string
  bits_bin_size_bytes: number
  consumed_bytes: number
  fresh_bytes: number
  low_water_bytes: number
  last_extract_event_count: number
  logger_service: string
  logger_service_active: boolean
  events_csv_age_s: number
  events_csv_size_bytes: number
  max_bytes_per_request: number
  reject_us: number
}

export interface MetricRow {
  ts_iso: string
  window_bytes: number
  window_deltas: number
  bias: number
  ones_pct: number
  ent_bpb: number
  chi_pct: number
  lag1_bits: number
  mean_dt_ms: number
  lag1_dt: number
  pileup_pct: number
}

export interface ContinuousHealth {
  available: boolean
  total_bits_processed: number
  rct: {
    cutoff: number
    current_run_length: number
    max_run_seen: number
    failed_ever: boolean
  }
  apt: {
    window_size: number
    cutoff: number
    position_in_window: number
    failed_ever: boolean
    last_verdict: [string, number, number]
  }
  fails_last_24h: number
  reject_us: number
}

export interface BatteryRow {
  ts_iso: string
  n_bits: number
  window_bytes: number
  ent_bpb: number
  ent_chi_pct: number
  practrand_max_bytes: number
  practrand_anomalies: number
  rabbit_n_stats: number
  rabbit_pass: number
  alphabit_n_stats: number
  alphabit_pass: number
  total_failures: number
  runtime_s: number
}

export interface BatteryHistory {
  n_rows: number
  rows: BatteryRow[]
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${TRNG_API}${path}`, { signal, cache: "no-store" })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export const getHealth = (s?: AbortSignal) => getJSON<HealthResponse>("/health", s)
export const getStats = (s?: AbortSignal) => getJSON<StatsResponse>("/stats", s)
export const getLatestMetric = (s?: AbortSignal) =>
  getJSON<{ row: MetricRow | null }>("/metrics/latest", s)
export const getMetrics = (since = "24h", s?: AbortSignal) =>
  getJSON<MetricRow[]>(`/metrics?since=${encodeURIComponent(since)}`, s)
export const getContinuous = (s?: AbortSignal) =>
  getJSON<ContinuousHealth>("/health/continuous", s)
export const getBattery = (n = 30, s?: AbortSignal) =>
  getJSON<BatteryHistory>(`/battery/history?n=${n}`, s)
export const getRandomHex = (n = 64, s?: AbortSignal) =>
  getJSON<{ hex: string; n: number }>(`/random/hex?n=${n}`, s)

// Upstream caps a single random pull at max_bytes_per_request (4096).
const MAX_BYTES_PER_REQUEST = 4096

// Raw binary entropy. /random/bytes returns an octet-stream — read it as an
// ArrayBuffer rather than JSON. Clamped to the per-request cap.
export async function getRandomBytes(n = MAX_BYTES_PER_REQUEST, signal?: AbortSignal): Promise<Uint8Array> {
  const want = Math.max(1, Math.min(n, MAX_BYTES_PER_REQUEST))
  const res = await fetch(`${TRNG_API}/random/bytes?n=${want}`, { signal, cache: "no-store" })
  if (!res.ok) throw new Error(`/random/bytes: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

// Pull `total` bytes of decay entropy, batching across the 4096-byte cap.
export async function getEntropyBytes(total: number, signal?: AbortSignal): Promise<Uint8Array> {
  const out = new Uint8Array(total)
  let off = 0
  while (off < total) {
    const chunk = await getRandomBytes(total - off, signal)
    if (chunk.length === 0) break
    out.set(chunk.subarray(0, total - off), off)
    off += chunk.length
  }
  return off === total ? out : out.subarray(0, off)
}

export interface MetricsWindow {
  since: string
  window_seconds: number
  n_rows: number
  rows: MetricRow[]
}

// NOTE: /metrics wraps the series in { rows } — the bare-array `getMetrics`
// above is mistyped. Prefer this for the windowed series.
export const getMetricsWindow = (since = "24h", s?: AbortSignal) =>
  getJSON<MetricsWindow>(`/metrics?since=${encodeURIComponent(since)}`, s)
