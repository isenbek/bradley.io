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
import { mapRamp, MAP_INK, SEQUENTIAL_HEX } from "@/lib/beta/chart-theme"

type LayerKey = "aircraft" | "density" | "tracks" | "rssi"
type DensityMode = "predicted" | "current" | "historical"

const MODE_PROP: Record<DensityMode, string> = {
  predicted: "predicted_count",
  current: "current_count",
  historical: "historical_avg_hour",
}

// Altitude (ft) is magnitude, so: one hue, light to dark. It used to run amber
// to cyan to violet to pink, which is a rainbow, and a rainbow has no order.
const ALT_COLOR: maplibregl.ExpressionSpecification = [
  "interpolate", ["linear"], ["coalesce", ["get", "alt"], 0],
  ...mapRamp([0, 12000, 25000, 34000, 40000]),
] as maplibregl.ExpressionSpecification

// Contacts per cell: also magnitude, also one hue. The old ramp ran navy to
// indigo to violet to RED to amber, which put the colour this palette reserves
// for a failed assertion in the middle of an ordinary aircraft count.
function densityColor(prop: string): maplibregl.ExpressionSpecification {
  return [
    "interpolate", ["linear"], ["coalesce", ["get", prop], 0],
    ...mapRamp([0, 1, 3, 5, 9]),
  ] as maplibregl.ExpressionSpecification
}

// A crisp arrowhead "dart", added as an SDF so icon-color can tint per-aircraft.
function makeDart(size = 24): ImageData {
  const c = document.createElement("canvas")
  c.width = c.height = size
  const ctx = c.getContext("2d")!
  // White on purpose: this is an SDF mask, and `icon-color` tints it per
  // aircraft. Changing it here would break the tinting, not restyle it.
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
        paint: { "line-color": MAP_INK.ocean, "line-opacity": 0.4, "line-width": 0.6 },
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
            0, "rgba(0,0,0,0)", 0.2, SEQUENTIAL_HEX[1], 0.5, SEQUENTIAL_HEX[2], 0.8, SEQUENTIAL_HEX[4], 1, MAP_INK.glass,
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
          "line-color": MAP_INK.burnt,
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
            `<div class="beta-air-pop"><strong>${p.callsign}</strong><span>${p.icao.toUpperCase()}</span>` +
              `<div class="beta-air-pop__rows">` +
              `<div>${alt} ft · ${spd} kt</div>` +
              (p.model ? `<div>${p.model}</div>` : "") +
              (p.owner ? `<div class="beta-air-pop__owner">${p.owner}</div>` : "") +
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
        paint: { "fill-color": MAP_INK.burnt, "fill-opacity": 0.08 },
      })
      map.addLayer({
        id: "rcv-glow",
        type: "circle",
        source: "rcv",
        paint: { "circle-radius": 11, "circle-color": MAP_INK.ocean, "circle-opacity": 0.22, "circle-blur": 0.6 },
      })
      map.addLayer({
        id: "rcv",
        type: "circle",
        source: "rcv",
        paint: { "circle-radius": 5, "circle-color": MAP_INK.glass, "circle-stroke-color": MAP_INK.ocean, "circle-stroke-width": 2 },
      })
      map.addLayer({
        id: "me-glow",
        type: "circle",
        source: "me",
        paint: { "circle-radius": 11, "circle-color": MAP_INK.burnt, "circle-opacity": 0.22, "circle-blur": 0.6 },
      })
      map.addLayer({
        id: "me",
        type: "circle",
        source: "me",
        paint: { "circle-radius": 5, "circle-color": MAP_INK.mustard, "circle-stroke-color": MAP_INK.burnt, "circle-stroke-width": 2 },
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
    <div className="beta-air">
      <div ref={containerRef} className="beta-air__map" />

      {initializing ? (
        <div className="beta-air__init" role="status" aria-live="polite">
          <span className="beta-air__loading-dot" aria-hidden />
          <span>bringing up the airspace…</span>
        </div>
      ) : null}

      <div className="beta-air__hud beta-air__hud--top">
        <span className={`beta-air__live beta-air__live--${status}`}>
          <span className="beta-air__live-dot" aria-hidden />
          {status === "offline" ? "receiver offline" : `${count} aircraft`}
        </span>
      </div>

      <div className="beta-air__panel">
        <span className="beta-air__panel-head">Layers</span>
        <button type="button" className="beta-air__lyr" style={{ ["--lc" as string]: MAP_INK.ocean }} data-on={layers.aircraft} data-loading={!loaded.aircraft} disabled={!loaded.aircraft} aria-busy={!loaded.aircraft} aria-pressed={layers.aircraft} onClick={() => toggle("aircraft")}>
          <i /> Aircraft
        </button>
        <button type="button" className="beta-air__lyr" style={{ ["--lc" as string]: MAP_INK.burnt }} data-on={layers.density} data-loading={!loaded.density} disabled={!loaded.density} aria-busy={!loaded.density} aria-pressed={layers.density} onClick={() => toggle("density")}>
          <i /> Density
        </button>
        {layers.density ? (
          <div className="beta-air__modes">
            {(["predicted", "current", "historical"] as DensityMode[]).map((m) => (
              <button key={m} type="button" className="beta-air__mode" data-on={mode === m} disabled={!loaded.density} onClick={() => setMode(m)}>
                {m === "historical" ? "hist" : m === "predicted" ? "pred" : "now"}
              </button>
            ))}
          </div>
        ) : null}
        <button type="button" className="beta-air__lyr" style={{ ["--lc" as string]: MAP_INK.mustard }} data-on={layers.tracks} data-loading={!loaded.tracks} disabled={!loaded.tracks} aria-busy={!loaded.tracks} aria-pressed={layers.tracks} onClick={() => toggle("tracks")}>
          <i /> Trajectories
        </button>
        <button type="button" className="beta-air__lyr" style={{ ["--lc" as string]: MAP_INK.forest }} data-on={layers.rssi} data-loading={!loaded.rssi} disabled={!loaded.rssi} aria-busy={!loaded.rssi} aria-pressed={layers.rssi} onClick={() => toggle("rssi")}>
          <i /> RSSI bloom
        </button>
      </div>

      <div className="beta-air__legend">
        <span>alt</span>
        <span className="beta-air__ramp beta-air__ramp--alt" />
        <span className="beta-air__legend-lo">0</span>
        <span className="beta-air__legend-hi">40k ft</span>
      </div>
    </div>
  )
}
