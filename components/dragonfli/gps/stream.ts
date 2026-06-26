"use client"

import { useEffect, useRef, useState } from "react"

// Live GPS firehose — the same CORS-open host the airspace map uses. Carries
// `gps` (TPV fix) and `satellites` (count/DOP) frames among the ADS-B traffic.
export const GPS_STREAM_URL = "wss://dragonfli.tinymachines.ai/stream"

// One satellite for the skyplot / SNR bars. NOTE: the public /stream
// `satellites` frame is currently aggregate-only (counts + DOP). Per-satellite
// detail (az/el/snr/used) is requested in tinymachines/adsb#2 — this adapter
// already reads an optional `satellites` array on the frame, so the panels
// light up the moment it ships, with no further wiring.
export interface Sat {
  prn: number
  az: number // degrees, 0..360 (0 = true north)
  el: number // degrees, 0 (horizon) .. 90 (zenith)
  snr: number // dB-Hz
  used: boolean
}

export interface Tpv {
  ts: number // epoch seconds
  mode: number // 0/1 = no fix, 2 = 2D, 3 = 3D
  lat: number
  lon: number
  alt_msl: number | null
  speed: number | null // m/s
  track: number | null // deg true
}

export interface SatAgg {
  ts: number
  n_used: number
  n_visible: number
  hdop: number | null
  pdop: number | null
  vdop: number | null
}

export type GpsStatus = "connecting" | "live" | "searching" | "offline"

export interface GpsState {
  status: GpsStatus
  tpv: Tpv | null
  history: Tpv[]
  sats: Sat[]
  agg: SatAgg | null
  lastFrameAt: number | null
}

const HISTORY_CAP = 600 // ~10 min of 1 Hz fixes for the jitter cloud
const FIX_STALE_MS = 15_000 // no TPV in this long → "searching"

interface RawFrame {
  type?: string
  ts?: number
  mode?: number
  lat?: number
  lon?: number
  alt_msl?: number | null
  speed?: number | null
  track?: number | null
  n_used?: number
  n_visible?: number
  hdop?: number | null
  pdop?: number | null
  vdop?: number | null
  satellites?: Array<{ prn?: number; PRN?: number; az?: number; el?: number; ss?: number; snr?: number; used?: boolean }>
}

function adaptSats(arr: RawFrame["satellites"]): Sat[] {
  if (!Array.isArray(arr)) return []
  return arr
    .map((s) => ({
      prn: Number(s.prn ?? s.PRN ?? 0),
      az: Number(s.az ?? 0),
      el: Number(s.el ?? 0),
      snr: Number(s.snr ?? s.ss ?? 0),
      used: Boolean(s.used),
    }))
    .filter((s) => s.prn > 0)
}

export function useGpsStream(): GpsState {
  const [state, setState] = useState<GpsState>({
    status: "connecting",
    tpv: null,
    history: [],
    sats: [],
    agg: null,
    lastFrameAt: null,
  })

  const historyRef = useRef<Tpv[]>([])
  const lastFixRef = useRef<number>(0)

  useEffect(() => {
    let ws: WebSocket | null = null
    let closedByUs = false
    let attempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    const hidden = () => document.visibilityState === "hidden"

    const scheduleReconnect = () => {
      const delay = Math.min(15_000, 1000 * 2 ** attempt)
      attempt += 1
      reconnectTimer = setTimeout(connect, delay)
    }

    function connect() {
      if (hidden()) return
      setState((s) => ({ ...s, status: s.tpv ? "live" : "connecting" }))
      try {
        ws = new WebSocket(GPS_STREAM_URL)
      } catch {
        scheduleReconnect()
        return
      }
      ws.onopen = () => {
        attempt = 0
        // Connected — we're now awaiting a fix (or already have one). The stale
        // timer manages searching↔live from here.
        setState((s) => ({ ...s, status: s.tpv ? "live" : "searching" }))
      }
      ws.onmessage = (ev) => {
        let f: RawFrame
        try {
          f = JSON.parse(typeof ev.data === "string" ? ev.data : "") as RawFrame
        } catch {
          return
        }
        const now = Date.now()
        if (f.type === "gps") {
          if (typeof f.lat === "number" && typeof f.lon === "number" && (f.mode ?? 0) >= 2) {
            const tpv: Tpv = {
              ts: f.ts ?? now / 1000,
              mode: f.mode ?? 0,
              lat: f.lat,
              lon: f.lon,
              alt_msl: f.alt_msl ?? null,
              speed: f.speed ?? null,
              track: f.track ?? null,
            }
            const hist = [...historyRef.current, tpv].slice(-HISTORY_CAP)
            historyRef.current = hist
            lastFixRef.current = now
            setState((s) => ({ ...s, status: "live", tpv, history: hist, lastFrameAt: now }))
          } else {
            setState((s) => ({ ...s, lastFrameAt: now }))
          }
        } else if (f.type === "satellites") {
          const agg: SatAgg = {
            ts: f.ts ?? now / 1000,
            n_used: f.n_used ?? 0,
            n_visible: f.n_visible ?? 0,
            hdop: f.hdop ?? null,
            pdop: f.pdop ?? null,
            vdop: f.vdop ?? null,
          }
          const sats = adaptSats(f.satellites)
          setState((s) => ({ ...s, agg, sats: sats.length ? sats : s.sats, lastFrameAt: now }))
        } else {
          setState((s) => ({ ...s, lastFrameAt: now }))
        }
      }
      ws.onerror = () => {
        try {
          ws?.close()
        } catch {
          /* noop */
        }
      }
      ws.onclose = () => {
        if (closedByUs) return
        setState((s) => ({ ...s, status: "offline" }))
        scheduleReconnect()
      }
    }

    // Demote to "searching" when no usable fix has landed recently (the current
    // reality: satellites frames flow but no TPV).
    const staleTimer = setInterval(() => {
      setState((s) => {
        if (s.status === "offline" || s.status === "connecting") return s
        const fresh = Date.now() - lastFixRef.current < FIX_STALE_MS
        return { ...s, status: fresh && s.tpv ? "live" : "searching" }
      })
    }, 3000)

    const onVis = () => {
      if (hidden()) {
        closedByUs = true
        try {
          ws?.close()
        } catch {
          /* noop */
        }
      } else {
        closedByUs = false
        attempt = 0
        connect()
      }
    }
    document.addEventListener("visibilitychange", onVis)

    connect()

    return () => {
      closedByUs = true
      document.removeEventListener("visibilitychange", onVis)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (staleTimer) clearInterval(staleTimer)
      try {
        ws?.close()
      } catch {
        /* noop */
      }
    }
  }, [])

  return state
}

// dB-Hz → a 0..1 strength ramp used by the skyplot + SNR bars.
export const snrT = (snr: number) => Math.max(0, Math.min(1, snr / 50))
