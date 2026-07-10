"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { airspaceStyle, GR_CENTER } from "@/components/dragonfli/airspace/style"
import { snrT, type Sat, type Tpv } from "./stream"
import { useGeolocation } from "@/lib/useGeolocation"
import { circlePolygon, destPoint, distanceM, fmtDistance } from "@/lib/geo"

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

// The viewer's own device location ("you are here") + its accuracy halo.
function meFC(me: { lon: number | null; lat: number | null }): GeoJSON.FeatureCollection {
  if (me.lon == null || me.lat == null) return EMPTY
  return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [me.lon, me.lat] } }] }
}
function meAccFC(me: { lon: number | null; lat: number | null; accuracy: number | null }): GeoJSON.FeatureCollection {
  if (me.lon == null || me.lat == null || !me.accuracy) return EMPTY
  return { type: "FeatureCollection", features: [circlePolygon(me.lon, me.lat, Math.min(me.accuracy, 5000))] }
}
// A connector between the viewer and the GPS receiver — the parallax between
// "where this phone is" and "where the sensor is."
function linkFC(me: { lon: number | null; lat: number | null }, tpv: Tpv | null): GeoJSON.FeatureCollection {
  if (me.lon == null || me.lat == null || !tpv) return EMPTY
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[me.lon, me.lat], [tpv.lon, tpv.lat]] } }],
  }
}

const RX_DUR = 950 // ms — a signal dot's flight from satellite to receiver
const PING_DUR = 1300 // ms — the data-arrival heartbeat ring
const PING_MAX_M = 700 // ring's final radius
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)

// Default export so it can be dynamically imported (ssr:false) — maplibre touches window.
export default function GroundTrack({ history, tpv, sats }: { history: Tpv[]; tpv: Tpv | null; sats: Sat[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const readyRef = useRef(false)
  const me = useGeolocation()
  // distance between viewer + receiver, shown in the HTML overlay (no map glyphs)
  const [gap, setGap] = useState<number | null>(null)
  // data-arrival animation state (driven by rAF, not React)
  const arrivalsRef = useRef<{ pings: { t0: number; c: [number, number] }[]; rx: { t0: number; from: [number, number]; to: [number, number] }[] }>({ pings: [], rx: [] })
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number>(0)

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
      map.addSource("me", { type: "geojson", data: EMPTY })
      map.addSource("me-acc", { type: "geojson", data: EMPTY })
      map.addSource("link", { type: "geojson", data: EMPTY })
      map.addSource("ping", { type: "geojson", data: EMPTY }) // data-arrival heartbeat
      map.addSource("rx", { type: "geojson", data: EMPTY }) // inbound signal dots

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

      // ---- data-arrival animation (under the markers) -------------------
      map.addLayer({
        id: "ping",
        type: "line",
        source: "ping",
        paint: { "line-color": "#5eead4", "line-width": 2, "line-opacity": ["get", "opacity"] },
      })
      map.addLayer({
        id: "rx",
        type: "circle",
        source: "rx",
        paint: {
          "circle-radius": ["+", 1.5, ["*", 2.5, ["get", "t"]]],
          "circle-color": "#7dffe6",
          "circle-opacity": ["get", "opacity"],
          "circle-blur": 0.2,
        },
      })

      // ---- viewer ("you are here") on top ------------------------------
      map.addLayer({
        id: "me-acc",
        type: "fill",
        source: "me-acc",
        paint: { "fill-color": "#ffb020", "fill-opacity": 0.08 },
      })
      map.addLayer({
        id: "link",
        type: "line",
        source: "link",
        paint: { "line-color": "#ffb020", "line-width": 1, "line-opacity": 0.5, "line-dasharray": [2, 2] },
      })
      map.addLayer({
        id: "me-glow",
        type: "circle",
        source: "me",
        paint: { "circle-radius": 12, "circle-color": "#ffb020", "circle-opacity": 0.22, "circle-blur": 0.6 },
      })
      map.addLayer({
        id: "me",
        type: "circle",
        source: "me",
        paint: {
          "circle-radius": 5,
          "circle-color": "#ffd98a",
          "circle-stroke-color": "#ffb020",
          "circle-stroke-width": 2,
        },
      })
      readyRef.current = true
    })

    return () => {
      ro.disconnect()
      readyRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  // rAF driver for the data-arrival animation: inbound signal dots converge from
  // each satellite to the receiver and a heartbeat ring blooms on every fix.
  function pump() {
    const map = mapRef.current
    if (!map || !readyRef.current) {
      rafRef.current = null
      return
    }
    const now = performance.now()
    const pingFeats: GeoJSON.Feature[] = []
    arrivalsRef.current.pings = arrivalsRef.current.pings.filter((p) => {
      const e = (now - p.t0) / PING_DUR
      if (e >= 1) return false
      const ring = circlePolygon(p.c[0], p.c[1], 20 + easeOut(e) * PING_MAX_M, 48)
      ring.properties = { opacity: 0.7 * (1 - e) }
      pingFeats.push(ring)
      return true
    })
    const rxFeats: GeoJSON.Feature[] = []
    arrivalsRef.current.rx = arrivalsRef.current.rx.filter((d) => {
      const prog = (now - d.t0) / RX_DUR
      if (prog >= 1) return false
      const x = d.from[0] + (d.to[0] - d.from[0]) * prog
      const y = d.from[1] + (d.to[1] - d.from[1]) * prog
      rxFeats.push({
        type: "Feature",
        properties: { t: prog, opacity: prog < 0.85 ? 0.9 : 0.9 * (1 - (prog - 0.85) / 0.15) },
        geometry: { type: "Point", coordinates: [x, y] },
      })
      return true
    })
    ;(map.getSource("ping") as maplibregl.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: pingFeats })
    ;(map.getSource("rx") as maplibregl.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: rxFeats })
    if (arrivalsRef.current.pings.length || arrivalsRef.current.rx.length) {
      rafRef.current = requestAnimationFrame(pump)
    } else {
      rafRef.current = null
    }
  }

  function triggerArrival(center: [number, number], usedSats: Sat[]) {
    const now = performance.now()
    arrivalsRef.current.pings.push({ t0: now, c: center })
    for (const s of usedSats.slice(0, 12)) {
      const el = Math.max(0, Math.min(90, s.el))
      const from = destPoint(center[1], center[0], s.az, Math.max(SPOKE_REACH_M * (1 - el / 90), 120))
      arrivalsRef.current.rx.push({ t0: now, from, to: center })
    }
    const pings = arrivalsRef.current.pings
    if (pings.length > 4) pings.splice(0, pings.length - 4)
    const rx = arrivalsRef.current.rx
    if (rx.length > 96) rx.splice(0, rx.length - 96)
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(pump)
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    ;(map.getSource("track") as maplibregl.GeoJSONSource | undefined)?.setData(trackFC(history))
    ;(map.getSource("pos") as maplibregl.GeoJSONSource | undefined)?.setData(posFC(tpv))
    ;(map.getSource("sat-spokes") as maplibregl.GeoJSONSource | undefined)?.setData(spokesFC(tpv, sats))
    ;(map.getSource("sat-dots") as maplibregl.GeoJSONSource | undefined)?.setData(satDotsFC(tpv, sats))
    ;(map.getSource("me") as maplibregl.GeoJSONSource | undefined)?.setData(meFC(me))
    ;(map.getSource("me-acc") as maplibregl.GeoJSONSource | undefined)?.setData(meAccFC(me))
    ;(map.getSource("link") as maplibregl.GeoJSONSource | undefined)?.setData(linkFC(me, tpv))
    setGap(me.lon != null && me.lat != null && tpv ? distanceM([me.lon, me.lat], [tpv.lon, tpv.lat]) : null)
    // fire the arrival animation when a fresh fix lands
    if (tpv && tpv.ts !== lastTsRef.current) {
      lastTsRef.current = tpv.ts
      triggerArrival([tpv.lon, tpv.lat], sats.filter((s) => s.used))
    }
    if (tpv) map.easeTo({ center: [tpv.lon, tpv.lat], duration: 600 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, tpv, sats, me])

  return (
    <div className="v3-gps-map-wrap">
      <div ref={ref} className="v3-gps__map" />
      <div className="v3-gps-map-legend">
        <span className="v3-gps-lg v3-gps-lg--gps" aria-hidden /> GPS fix
        <span className="v3-gps-lg v3-gps-lg--me" aria-hidden /> you
        {gap != null ? <span className="v3-gps-lg__gap">{fmtDistance(gap)} apart</span> : null}
        {me.status === "denied" ? <span className="v3-gps-lg__gap">location blocked</span> : null}
        {me.status === "locating" ? <span className="v3-gps-lg__gap">locating you…</span> : null}
      </div>
      {!tpv && (
        <div className="v3-gps-map-note">
          <span className="v3-gps-empty__dot" aria-hidden />
          awaiting GPS fix, basemap centred on the receiver
        </div>
      )}
    </div>
  )
}
