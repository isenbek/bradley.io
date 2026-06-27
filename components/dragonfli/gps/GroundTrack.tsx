"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { airspaceStyle, GR_CENTER } from "@/components/dragonfli/airspace/style"
import { snrT, type Sat, type Tpv } from "./stream"

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] }

// How far a horizon satellite's spoke reaches from the receiver (metres). The
// length encodes elevation: zenith sats sit near the dot, horizon sats reach out.
const SPOKE_REACH_M = 3000

function trackFC(history: Tpv[]): GeoJSON.FeatureCollection {
  if (history.length < 2) return EMPTY
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: history.map((p) => [p.lon, p.lat]) },
      },
    ],
  }
}

function posFC(tpv: Tpv | null): GeoJSON.FeatureCollection {
  if (!tpv) return EMPTY
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [tpv.lon, tpv.lat] } }],
  }
}

// Great-circle destination from (lat,lon) at a compass bearing (0 = N, CW) + distance.
function destPoint(lat: number, lon: number, bearingDeg: number, distM: number): [number, number] {
  const R = 6371000
  const d = distM / R
  const br = (bearingDeg * Math.PI) / 180
  const f1 = (lat * Math.PI) / 180
  const l1 = (lon * Math.PI) / 180
  const f2 = Math.asin(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(br))
  const l2 = l1 + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2))
  return [(l2 * 180) / Math.PI, (f2 * 180) / Math.PI]
}

// One spoke per satellite: a line from the receiver toward the sat's azimuth.
//   direction = azimuth · length = (90−elevation) · opacity = signal · width = elevation
function satEnd(tpv: Tpv, s: Sat): [number, number] {
  const el = Math.max(0, Math.min(90, s.el))
  return destPoint(tpv.lat, tpv.lon, s.az, Math.max(SPOKE_REACH_M * (1 - el / 90), 120))
}

function spokesFC(tpv: Tpv | null, sats: Sat[]): GeoJSON.FeatureCollection {
  if (!tpv || !sats.length) return EMPTY
  return {
    type: "FeatureCollection",
    features: sats.map((s) => {
      const el = Math.max(0, Math.min(90, s.el))
      const t = snrT(s.snr)
      return {
        type: "Feature" as const,
        properties: {
          opacity: 0.18 + 0.62 * t, // signal strength → brightness
          width: 1.2 + 3 * (el / 90), // elevation → thickness
          used: s.used ? 1 : 0,
        },
        geometry: { type: "LineString" as const, coordinates: [[tpv.lon, tpv.lat], satEnd(tpv, s)] },
      }
    }),
  }
}

function satDotsFC(tpv: Tpv | null, sats: Sat[]): GeoJSON.FeatureCollection {
  if (!tpv || !sats.length) return EMPTY
  return {
    type: "FeatureCollection",
    features: sats.map((s) => ({
      type: "Feature" as const,
      properties: { used: s.used ? 1 : 0, t: snrT(s.snr) },
      geometry: { type: "Point" as const, coordinates: satEnd(tpv, s) },
    })),
  }
}

// Default export so it can be dynamically imported (ssr:false) — maplibre touches window.
export default function GroundTrack({ history, tpv, sats }: { history: Tpv[]; tpv: Tpv | null; sats: Sat[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const readyRef = useRef(false)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const map = new maplibregl.Map({
      container,
      style: airspaceStyle,
      center: GR_CENTER,
      zoom: 12,
      attributionControl: false,
    })
    mapRef.current = map
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(container)
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

    map.on("load", () => {
      map.resize()
      map.addSource("track", { type: "geojson", data: EMPTY })
      map.addSource("pos", { type: "geojson", data: EMPTY })
      map.addSource("sat-spokes", { type: "geojson", data: EMPTY })
      map.addSource("sat-dots", { type: "geojson", data: EMPTY })

      // Satellite spokes sit UNDER the track + receiver dot.
      map.addLayer({
        id: "sat-spokes",
        type: "line",
        source: "sat-spokes",
        layout: { "line-cap": "round" },
        paint: {
          "line-color": ["case", ["==", ["get", "used"], 1], "#3fd0ff", "#6b8a99"],
          "line-width": ["get", "width"],
          "line-opacity": ["get", "opacity"],
        },
      })
      map.addLayer({
        id: "sat-dots",
        type: "circle",
        source: "sat-dots",
        paint: {
          "circle-radius": 3,
          "circle-color": ["case", ["==", ["get", "used"], 1], "#bdecff", "#9fc0ce"],
          "circle-opacity": ["+", 0.3, ["*", 0.6, ["get", "t"]]],
        },
      })
      map.addLayer({
        id: "track",
        type: "line",
        source: "track",
        paint: { "line-color": "#13B8F3", "line-width": 2.5, "line-opacity": 0.85 },
      })
      map.addLayer({
        id: "pos-glow",
        type: "circle",
        source: "pos",
        paint: { "circle-radius": 13, "circle-color": "#13B8F3", "circle-opacity": 0.22, "circle-blur": 0.6 },
      })
      map.addLayer({
        id: "pos",
        type: "circle",
        source: "pos",
        paint: {
          "circle-radius": 5,
          "circle-color": "#bdecff",
          "circle-stroke-color": "#13B8F3",
          "circle-stroke-width": 2,
        },
      })
      readyRef.current = true
    })

    return () => {
      ro.disconnect()
      readyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    ;(map.getSource("track") as maplibregl.GeoJSONSource | undefined)?.setData(trackFC(history))
    ;(map.getSource("pos") as maplibregl.GeoJSONSource | undefined)?.setData(posFC(tpv))
    ;(map.getSource("sat-spokes") as maplibregl.GeoJSONSource | undefined)?.setData(spokesFC(tpv, sats))
    ;(map.getSource("sat-dots") as maplibregl.GeoJSONSource | undefined)?.setData(satDotsFC(tpv, sats))
    if (tpv) map.easeTo({ center: [tpv.lon, tpv.lat], duration: 600 })
  }, [history, tpv, sats])

  return (
    <div className="v3-gps-map-wrap">
      <div ref={ref} className="v3-gps__map" />
      {!tpv && (
        <div className="v3-gps-map-note">
          <span className="v3-gps-empty__dot" aria-hidden />
          awaiting GPS fix — basemap centred on the receiver
        </div>
      )}
    </div>
  )
}
