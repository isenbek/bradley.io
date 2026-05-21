export const SDR_PROXY = "/api/sdr"

export interface HealthResponse {
  status: string
  version: string
  db: string
}

export interface Band {
  id: number
  name: string
  scanner: string
  lo_hz: number | null
  hi_hz: number | null
  channels: number[] | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface SoakBand {
  band: string
  dates: string[]
  n_hits: number
  first_seen: string
  last_seen: string
}

export interface FreqHit {
  freq_hz: number
  n: number
}

export interface SoakSummary {
  band: string
  date: string | null
  n_hits: number
  time_range: { first: string; last: string }
  top: FreqHit[]
}

export interface Job {
  id: number
  name: string
  scanner: string
  band_id: number | null
  duration_s: number | null
  dwell_s: number | null
  status: string
  run_dir: string | null
  unit: string | null
  created_at: string
  started_at: string | null
  stopped_at: string | null
  exit_code: number | null
  notes: string | null
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${SDR_PROXY}${path}`, { signal, cache: "no-store" })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export const getHealth = (s?: AbortSignal) => getJSON<HealthResponse>("/health", s)
export const getBands = (s?: AbortSignal) => getJSON<Band[]>("/bands", s)
export const getSoak = (s?: AbortSignal) => getJSON<SoakBand[]>("/soak", s)
export const getSoakSummary = (band: string, s?: AbortSignal) =>
  getJSON<SoakSummary>(`/soak/${encodeURIComponent(band)}/summary`, s)
export const getJobs = (s?: AbortSignal) => getJSON<Job[]>("/jobs", s)
