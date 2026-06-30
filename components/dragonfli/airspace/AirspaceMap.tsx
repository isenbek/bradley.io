"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  getActive,
  getReceiver,
  getPredictBbox,
  getPredictTrack,
  type Aircraft,
  type PredictTrack,
} from "@/components/dragonfli/api"
import { airspaceStyle, GR_CENTER } from "./style"
import { useGeolocation } from "@/lib/useGeolocation"
import { circlePolygon } from "@/lib/geo"

type LayerKey = "aircraft" | "density" | "tracks" | "rssi"
type DensityMode = "predicted" | "current" | "historical"

const MODE_PROP: Record<DensityMode, string> = {
  predicted: "predicted_count",
  current: "current_count",
  historical: "historical_avg_hour",
}

// altitude → color ramp (ft): low amber → mid cyan → high violet → very-high pink
const ALT_COLOR: maplibregl.ExpressionSpecification = [
  "interpolate", ["linear"], ["coalesce", ["get", "alt"], 0],
  0, "#fbbf24", 12000, "#3fd0ff", 25000, "#8b5cf6", 40000, "#ff5c8a",
]

function densityColor(prop: string): maplibregl.ExpressionSpecification {
  return [
    "interpolate", ["linear"], ["coalesce", ["get", prop], 0],
    0, "#1e3a8a", 1, "#4338ca", 3, "#7c3aed", 5, "#dc2626", 9, "#fbbf24",
  ]
}

// A crisp arrowhead "dart", added as an SDF so icon-color can tint per-aircraft.
function makeDart(size = 24): ImageData {
  const c = document.createElement("canvas")
  c.width = c.height = size
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.moveTo(size / 2, 2)
  ctx.lineTo(size - 4, size - 3)
  ctx.lineTo(size / 2, size * 0.7)
  ctx.lineTo(4, size - 3)
  ctx.closePath()
  ctx.fill()
  return ctx.getImageData(0, 0, size, size)
}

function aircraftFC(list: Aircraft[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list
      .filter((a) => a.lat != null && a.lon != null)
      .map((a) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [a.lon as number, a.lat as number] },
        properties: {
          icao: a.icao,
          track: a.track ?? 0,
          alt: a.alt_baro ?? 0,
          rssi: a.rssi_db ?? -30,
          callsign: a.callsign ?? a.icao,
          speed: a.speed ?? 0,
          owner: a.enrich?.owner ?? "",
          model: a.enrich?.model ?? "",
        },
      })),
  }
}

function tracksFC(tracks: PredictTrack[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: tracks
      .filter((t) => t.predictions?.length)
      .map((t) => ({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [t.current.lon, t.current.lat],
            ...t.predictions.map((p) => [p.lon, p.lat] as [number, number]),
          ],
        },
        properties: { icao: t.icao },
      })),
  }
}

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] }

export default function AirspaceMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const readyRef = useRef(false)
  const me = useGeolocation()

  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    aircraft: true,
    density: true,
    tracks: true,
    rssi: true,
  })
  const [mode, setMode] = useState<DensityMode>("predicted")
  const [count, setCount] = useState(0)
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading")
  // map.on("load") has fired AND the layers exist — gates the sync effects below
  // so they (re)apply current toggle/mode state the instant the map is live,
  // instead of silently bailing during the initial pre-load render (the race
  // that left tracks/rssi hidden until you cycled a toggle).
  const [ready, setReady] = useState(false)
  // per-layer "first data has landed" — until then the toggle is disabled and its
  // LED blinks. aircraft + rssi share the same source so they light together;
  // trajectories land after the predict round-trip; density after its bbox query.
  const [loaded, setLoaded] = useState<Record<LayerKey, boolean>>({
    aircraft: false,
    density: false,
    tracks: false,
    rssi: false,
  })

  // ---- map init (once) ----
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = new maplibregl.Map({
      container,
      style: airspaceStyle,
      center: GR_CENTER,
      zoom: 8,
      minZoom: 4,
      maxZoom: 13,
      attributionControl: false,
    })
    mapRef.current = map

    // The map can mount into a container that hasn't settled its height yet
    // (dynamic import + clamp() height) — MapLibre would lock to a default
    // 300px buffer. A ResizeObserver keeps the GL viewport matched to the box.
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(container)
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: "© OpenMapTiles · OpenStreetMap" }),
      "bottom-right"
    )

    let aircraftTimer: ReturnType<typeof setInterval> | null = null
    let densityTimer: ReturnType<typeof setInterval> | null = null
    let moveTimer: ReturnType<typeof setTimeout> | null = null
    let aborted = false

    const pollAircraft = async () => {
      try {
        const res = await getActive()
        if (aborted || !mapRef.current) return
        ;(map.getSource("aircraft") as maplibregl.GeoJSONSource)?.setData(aircraftFC(res.aircraft))
        setCount(res.count)
        setStatus("live")
        setLoaded((s) => (s.aircraft && s.rssi ? s : { ...s, aircraft: true, rssi: true }))
        // trajectory forecasts for the visible aircraft (cap to keep it light)
        const withPos = res.aircraft.filter((a) => a.lat != null && a.lon != null).slice(0, 12)
        const tracks = (
          await Promise.all(withPos.map((a) => getPredictTrack(a.icao).catch(() => null)))
        ).filter(Boolean) as PredictTrack[]
        if (aborted || !mapRef.current) return
        ;(map.getSource("tracks") as maplibregl.GeoJSONSource)?.setData(tracksFC(tracks))
        setLoaded((s) => (s.tracks ? s : { ...s, tracks: true }))
      } catch {
        if (!aborted) {
          setStatus("offline")
          // nothing more is coming — release the toggles so they don't blink forever
          setLoaded({ aircraft: true, density: true, tracks: true, rssi: true })
        }
      }
    }

    const pollDensity = async () => {
      if (!mapRef.current) return
      if (map.getZoom() < 6) {
        ;(map.getSource("density") as maplibregl.GeoJSONSource)?.setData(EMPTY)
        setLoaded((s) => (s.density ? s : { ...s, density: true }))
        return
      }
      const b = map.getBounds()
      const bbox = `${b.getWest().toFixed(4)},${b.getSouth().toFixed(4)},${b.getEast().toFixed(4)},${b.getNorth().toFixed(4)}`
      try {
        const fc = await getPredictBbox(bbox)
        if (aborted || !mapRef.current) return
        ;(map.getSource("density") as maplibregl.GeoJSONSource)?.setData(fc)
      } catch {
        /* leave last good */
      } finally {
        // resolved or failed, the first attempt is done — release the toggle
        if (!aborted) setLoaded((s) => (s.density ? s : { ...s, density: true }))
      }
    }

    map.on("load", () => {
      readyRef.current = true
      setReady(true)
      map.resize() // match the now-settled container box
      map.addImage("dart", makeDart(), { sdf: true })

      map.addSource("density", { type: "geojson", data: EMPTY })
      map.addSource("aircraft", { type: "geojson", data: EMPTY })
      map.addSource("tracks", { type: "geojson", data: EMPTY })

      map.addLayer({
        id: "density-fill",
        type: "fill",
        source: "density",
        paint: {
          "fill-color": densityColor(MODE_PROP.predicted),
          "fill-opacity": ["max", 0.34, ["*", 0.9, ["coalesce", ["get", "confidence"], 0.45]]],
        },
      })
      map.addLayer({
        id: "density-line",
        type: "line",
        source: "density",
        paint: { "line-color": "#3fd0ff", "line-opacity": 0.4, "line-width": 0.6 },
      })
      map.addLayer({
        id: "rssi",
        type: "heatmap",
        source: "aircraft",
        layout: { visibility: "none" },
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "rssi"], -30, 0.1, -5, 1],
          "heatmap-intensity": 1.1,
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 6, 16, 11, 42],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)", 0.2, "#13384f", 0.5, "#1f7a9c", 0.8, "#3fd0ff", 1, "#eafaff",
          ],
          "heatmap-opacity": 0.75,
        },
      })
      map.addLayer({
        id: "tracks",
        type: "line",
        source: "tracks",
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": "#ff8a3d",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 11, 2.2],
          "line-opacity": 0.75,
          "line-dasharray": [1, 1.4],
        },
      })
      map.addLayer({
        id: "aircraft",
        type: "symbol",
        source: "aircraft",
        layout: {
          "icon-image": "dart",
          "icon-rotate": ["get", "track"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.7, 11, 1.15],
        },
        paint: { "icon-color": ALT_COLOR },
      })

      // click → enrichment popup
      map.on("click", "aircraft", (e) => {
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties as Record<string, string>
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number]
        const alt = Number(p.alt).toLocaleString()
        const spd = Math.round(Number(p.speed))
        new maplibregl.Popup({ offset: 12, closeButton: false, maxWidth: "260px" })
          .setLngLat(coords)
          .setHTML(
            `<div class="v3-air-pop"><strong>${p.callsign}</strong><span>${p.icao.toUpperCase()}</span>` +
              `<div class="v3-air-pop__rows">` +
              `<div>${alt} ft · ${spd} kt</div>` +
              (p.model ? `<div>${p.model}</div>` : "") +
              (p.owner ? `<div class="v3-air-pop__owner">${p.owner}</div>` : "") +
              `</div></div>`
          )
          .addTo(map)
      })
      map.on("mouseenter", "aircraft", () => (map.getCanvas().style.cursor = "pointer"))
      map.on("mouseleave", "aircraft", () => (map.getCanvas().style.cursor = ""))

      // ---- receiver (GPS) + viewer ("you are here") on top -------------
      map.addSource("rcv", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: GR_CENTER } },
      })
      map.addSource("me", { type: "geojson", data: EMPTY })
      map.addSource("me-acc", { type: "geojson", data: EMPTY })
      map.addLayer({
        id: "me-acc",
        type: "fill",
        source: "me-acc",
        paint: { "fill-color": "#ffb020", "fill-opacity": 0.08 },
      })
      map.addLayer({
        id: "rcv-glow",
        type: "circle",
        source: "rcv",
        paint: { "circle-radius": 11, "circle-color": "#13B8F3", "circle-opacity": 0.22, "circle-blur": 0.6 },
      })
      map.addLayer({
        id: "rcv",
        type: "circle",
        source: "rcv",
        paint: { "circle-radius": 5, "circle-color": "#bdecff", "circle-stroke-color": "#13B8F3", "circle-stroke-width": 2 },
      })
      map.addLayer({
        id: "me-glow",
        type: "circle",
        source: "me",
        paint: { "circle-radius": 11, "circle-color": "#ffb020", "circle-opacity": 0.22, "circle-blur": 0.6 },
      })
      map.addLayer({
        id: "me",
        type: "circle",
        source: "me",
        paint: { "circle-radius": 5, "circle-color": "#ffd98a", "circle-stroke-color": "#ffb020", "circle-stroke-width": 2 },
      })

      // center on the receiver if it has a fix
      getReceiver()
        .then((r) => {
          if (!aborted && r?.lat && r?.lon && !r.is_stale) map.jumpTo({ center: [r.lon, r.lat], zoom: 8 })
        })
        .catch(() => {})

      pollAircraft()
      pollDensity()
      aircraftTimer = setInterval(pollAircraft, 8000)
      densityTimer = setInterval(pollDensity, 60000)
      map.on("moveend", () => {
        if (moveTimer) clearTimeout(moveTimer)
        moveTimer = setTimeout(pollDensity, 600)
      })
    })

    return () => {
      aborted = true
      ro.disconnect()
      if (aircraftTimer) clearInterval(aircraftTimer)
      if (densityTimer) clearInterval(densityTimer)
      if (moveTimer) clearTimeout(moveTimer)
      readyRef.current = false
      setReady(false)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ---- apply layer visibility toggles (also runs once `ready` flips, syncing
  // the layers MapLibre created hidden — tracks/rssi — to the live toggle state) ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const vis = (id: string, on: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none")
    }
    vis("aircraft", layers.aircraft)
    vis("density-fill", layers.density)
    vis("density-line", layers.density)
    vis("tracks", layers.tracks)
    vis("rssi", layers.rssi)
  }, [layers, ready])

  // ---- density mode → recolor ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !map.getLayer("density-fill")) return
    map.setPaintProperty("density-fill", "fill-color", densityColor(MODE_PROP[mode]))
  }, [mode, ready])

  // ---- viewer location → "you are here" marker ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !map.getSource("me")) return
    const pt: GeoJSON.FeatureCollection =
      me.lon != null && me.lat != null
        ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [me.lon, me.lat] } }] }
        : EMPTY
    const acc: GeoJSON.FeatureCollection =
      me.lon != null && me.lat != null && me.accuracy
        ? { type: "FeatureCollection", features: [circlePolygon(me.lon, me.lat, Math.min(me.accuracy, 20000))] }
        : EMPTY
    ;(map.getSource("me") as maplibregl.GeoJSONSource).setData(pt)
    ;(map.getSource("me-acc") as maplibregl.GeoJSONSource).setData(acc)
  }, [me, ready])

  const toggle = (k: LayerKey) => setLayers((s) => ({ ...s, [k]: !s[k] }))

  // opaque cover until the map is live AND first aircraft poll has resolved
  const initializing = !ready || status === "loading"

  return (
    <div className="v3-air">
      <div ref={containerRef} className="v3-air__map" />

      {initializing ? (
        <div className="v3-air__init" role="status" aria-live="polite">
          <span className="v3-air__loading-dot" aria-hidden />
          <span>bringing up the airspace…</span>
        </div>
      ) : null}

      <div className="v3-air__hud v3-air__hud--top">
        <span className={`v3-air__live v3-air__live--${status}`}>
          <span className="v3-air__live-dot" aria-hidden />
          {status === "offline" ? "receiver offline" : `${count} aircraft`}
        </span>
      </div>

      <div className="v3-air__panel">
        <span className="v3-air__panel-head">Layers</span>
        <button type="button" className="v3-air__lyr" style={{ ["--lc" as string]: "#3fd0ff" }} data-on={layers.aircraft} data-loading={!loaded.aircraft} disabled={!loaded.aircraft} aria-busy={!loaded.aircraft} aria-pressed={layers.aircraft} onClick={() => toggle("aircraft")}>
          <i /> Aircraft
        </button>
        <button type="button" className="v3-air__lyr" style={{ ["--lc" as string]: "#7c3aed" }} data-on={layers.density} data-loading={!loaded.density} disabled={!loaded.density} aria-busy={!loaded.density} aria-pressed={layers.density} onClick={() => toggle("density")}>
          <i /> Density
        </button>
        {layers.density ? (
          <div className="v3-air__modes">
            {(["predicted", "current", "historical"] as DensityMode[]).map((m) => (
              <button key={m} type="button" className="v3-air__mode" data-on={mode === m} disabled={!loaded.density} onClick={() => setMode(m)}>
                {m === "historical" ? "hist" : m === "predicted" ? "pred" : "now"}
              </button>
            ))}
          </div>
        ) : null}
        <button type="button" className="v3-air__lyr" style={{ ["--lc" as string]: "#ff8a3d" }} data-on={layers.tracks} data-loading={!loaded.tracks} disabled={!loaded.tracks} aria-busy={!loaded.tracks} aria-pressed={layers.tracks} onClick={() => toggle("tracks")}>
          <i /> Trajectories
        </button>
        <button type="button" className="v3-air__lyr" style={{ ["--lc" as string]: "#eafaff" }} data-on={layers.rssi} data-loading={!loaded.rssi} disabled={!loaded.rssi} aria-busy={!loaded.rssi} aria-pressed={layers.rssi} onClick={() => toggle("rssi")}>
          <i /> RSSI bloom
        </button>
      </div>

      <div className="v3-air__legend">
        <span>alt</span>
        <span className="v3-air__ramp v3-air__ramp--alt" />
        <span className="v3-air__legend-lo">0</span>
        <span className="v3-air__legend-hi">40k ft</span>
      </div>
    </div>
  )
}
