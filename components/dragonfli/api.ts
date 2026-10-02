export const DRAGONFLI_API = "https://dragonfli.tinymachines.ai"

export interface HealthResponse {
  status: string
  uptime_s: number
  // The newest envelope of ANY kind off the perception bus: GPS fixes,
  // satellite frames and clock tracking as well as ADS-B (the API sets it for
  // every envelope it dequeues, before it looks at the type). GPS alone
  // arrives about once a second, so this stays under a second with the 1090
  // radio dead. It says the box is talking. It does NOT say the antenna is
  // hearing aircraft; adsbLastHeard() below is the datum for that.
  //
  // Both are null on a decoder that has received nothing since it started.
  // That is a real state (observed 2026-10-02: status "ok", received 0), not a
  // missing field, and "ok" beside it is exactly the trap the board warns about.
  last_event_ts: number | null
  last_event_age_s: number | null
  // Lifetime count of bus envelopes, again of every kind, not ADS-B messages.
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

/** How long a bus question may stay open before the board goes on without it. */
const BUS_TIMEOUT_MS = 6_000

/**
 * When the perception bus last carried an event of any of these schemas, as
 * epoch ms, or null if it never has (or the bus snapshot cannot be read).
 *
 * The Dragonfli API and the WorldEvent bus are two readers of the same antenna
 * box, and the bus collector on this host keeps the time of the last event it
 * received PER SCHEMA. That makes it the one source here that can tell "the
 * box is talking" from "the 1090 radio is hearing aircraft", and the one that
 * still knows when the API is down and can say nothing at all.
 *
 * Never rejects and never hangs: the boards wait on it before judging, so an
 * unanswered question resolves to null after BUS_TIMEOUT_MS.
 */
export async function busLastHeard(
  schemas: string[],
  signal?: AbortSignal
): Promise<number | null> {
  const ac = new AbortController()
  const giveUp = setTimeout(() => ac.abort(), BUS_TIMEOUT_MS)
  const onAbort = () => ac.abort()
  if (signal?.aborted) ac.abort()
  else signal?.addEventListener("abort", onAbort, { once: true })
  try {
    const res = await fetch("/api/worldevent", { signal: ac.signal, cache: "no-store" })
    if (!res.ok) return null
    const snap = (await res.json()) as { types?: { type?: string; lastTs?: number }[] }
    let newest = 0
    for (const t of snap.types ?? []) {
      if (t.type && schemas.includes(t.type) && typeof t.lastTs === "number" && t.lastTs > newest) {
        newest = t.lastTs
      }
    }
    return newest > 0 ? Math.round(newest * 1000) : null
  } catch {
    return null
  } finally {
    clearTimeout(giveUp)
    signal?.removeEventListener("abort", onAbort)
  }
}

/** The bus schemas that are the ADS-B antenna speaking, and the GPS receiver. */
export const BUS_ADSB = ["adsb.mode_s", "adsb.uat"]
export const BUS_GPS = ["gps.position", "gps.satellites"]

/**
 * When the 1090 antenna was last heard, epoch ms, from ADS-B evidence only.
 *
 * Two sources, and both are ADS-B and nothing else:
 *
 *  - the newest `last_seen` among the aircraft the decoder is tracking. The
 *    tracker stamps it on every Mode S or UAT frame and on nothing else, and
 *    drops an aircraft 30 s after its last frame, so while anything is
 *    overhead this is current to the poll.
 *  - the bus's last adsb.mode_s / adsb.uat event (busLastHeard(BUS_ADSB)),
 *    which is what answers when the tracked list is empty or the API is down.
 *
 * The newer of the two. Deliberately NOT /health's last_event_age_s: that is
 * the last bus envelope of any kind, and a box whose GPS dongle is delivering
 * keeps it under a second while the 1090 radio is dead. Judging the antenna
 * by it showed LIVE over a silent antenna.
 */
export function adsbLastHeard(
  aircraft: Pick<Aircraft, "last_seen">[] | null | undefined,
  busAtMs: number | null
): number | null {
  let newestS = 0
  for (const a of aircraft ?? []) {
    if (typeof a.last_seen === "number" && a.last_seen > newestS) newestS = a.last_seen
  }
  const apiAtMs = newestS > 0 ? Math.round(newestS * 1000) : null
  if (apiAtMs != null && busAtMs != null) return Math.max(apiAtMs, busAtMs)
  return apiAtMs ?? busAtMs
}

export const getHealth = (s?: AbortSignal) => getJSON<HealthResponse>("/health", s)
export const getReceiver = (s?: AbortSignal) => getJSON<ReceiverFix>("/receiver", s)
export const getActive = (s?: AbortSignal) => getJSON<ActiveResponse>("/aircraft/active", s)
export const getRegistryStats = (s?: AbortSignal) =>
  getJSON<RegistryStats>("/registry/stats", s)
export const getPredictStatus = (s?: AbortSignal) =>
  getJSON<PredictStatus>("/predict_status", s)

// ---- Density forecast (GeoJSON, drops straight into a MapLibre source) ----

export interface DensityProps {
  geohash: string
  center_lat: number
  center_lon: number
  predicted_count: number
  predicted_raw: number
  current_count: number
  historical_avg_hour: number
  confidence: number
}
export type DensityCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon, DensityProps> & {
  truncated?: boolean
  n_features?: number
  horizon_minutes?: number
}

/** bbox = "west,south,east,north" in decimal degrees. */
export const getPredictBbox = (bbox: string, maxCells = 1500, s?: AbortSignal) =>
  getJSON<DensityCollection>(
    `/predict_bbox?bbox=${encodeURIComponent(bbox)}&max_cells=${maxCells}`,
    s
  )

// ---- Per-aircraft trajectory forecast (kinematic + lgbm residual) ----

export interface TrackPoint {
  t_offset_s: number
  lat: number
  lon: number
  alt_baro: number | null
  ground_distance_nm: number
  confidence: number
}
export interface PredictTrack {
  icao: string
  as_of: string
  horizon_s: number
  step_s: number
  method: string
  current: { lat: number; lon: number; alt_baro: number | null; speed: number | null; track: number | null }
  predictions: TrackPoint[]
}
export const getPredictTrack = (icao: string, s?: AbortSignal) =>
  getJSON<PredictTrack>(`/predict_track/${icao}`, s)
