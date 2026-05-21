export const DRAGONFLI_API = "https://dragonfli.tinymachines.ai"

export interface HealthResponse {
  status: string
  uptime_s: number
  last_event_ts: number
  last_event_age_s: number
  received: number
  parse_errors: number
  queue_full_drops: number
  clients: number
  n_aircraft_active: number
}

export interface ReceiverFix {
  ts: number
  host: string
  mode: number
  lat: number
  lon: number
  alt_msl: number
  n_used: number
  hdop: number
  is_stale: boolean
  age_s: number
}

export interface AircraftEnrich {
  n_number?: string | null
  owner?: string | null
  manufacturer?: string | null
  model?: string | null
  type?: string | null
  seats?: number | null
  engines?: number | null
  year?: number | null
  city?: string | null
  state?: string | null
}

export interface Aircraft {
  icao: string
  source: string
  callsign: string | null
  squawk: string | null
  lat: number | null
  lon: number | null
  alt_baro: number | null
  alt_geom: number | null
  speed: number | null
  track: number | null
  vertical_rate: number | null
  rssi_db: number | null
  n_msgs: number
  first_seen: number
  last_seen: number
  enrich: AircraftEnrich | null
}

export interface ActiveResponse {
  count: number
  aircraft: Aircraft[]
}

export interface RegistryStats {
  total_aircraft: number
  aircraft_by_type: Record<string, number>
  top_manufacturers: Record<string, number>
}

export interface PredictStatus {
  model_loaded: boolean
  model_path: string
  model_meta: {
    bucket_minutes: number
    geohash_precision: number
    trained_at: string
    model_version: string
  }
  cache_stats: {
    loaded_at: string
    age_seconds: number
    recent_aircraft_rows: number
    historical_patterns_rows: number
    geohash_metadata_cells: number
  }
  metrics: {
    predictions_served: number
    predictions_bbox_served: number
    missing_cache: number
    errors: number
    started_at: string
  }
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${DRAGONFLI_API}${path}`, { signal, cache: "no-store" })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export const getHealth = (s?: AbortSignal) => getJSON<HealthResponse>("/health", s)
export const getReceiver = (s?: AbortSignal) => getJSON<ReceiverFix>("/receiver", s)
export const getActive = (s?: AbortSignal) => getJSON<ActiveResponse>("/aircraft/active", s)
export const getRegistryStats = (s?: AbortSignal) =>
  getJSON<RegistryStats>("/registry/stats", s)
export const getPredictStatus = (s?: AbortSignal) =>
  getJSON<PredictStatus>("/predict_status", s)
