"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { airspaceStyle, GR_CENTER } from "@/components/dragonfli/airspace/style"
import type { Tpv } from "./stream"

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] }

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

// Default export so it can be dynamically imported (ssr:false) — maplibre touches window.
export default function GroundTrack({ history, tpv }: { history: Tpv[]; tpv: Tpv | null }) {
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
    if (tpv) map.easeTo({ center: [tpv.lon, tpv.lat], duration: 600 })
  }, [history, tpv])

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
