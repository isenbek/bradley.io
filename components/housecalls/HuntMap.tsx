"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TILEJSON, GR_CENTER } from "@/components/dragonfli/airspace/style"
import { MAP_INK, mapRamp } from "@/lib/beta/chart-theme"
import { PIN_STAGES, STAGE_COLOR, STAGE_RADIUS, type PinFile, type PinStage } from "./pins"

/**
 * The territory: prospect density over Michigan counties.
 *
 * County polygons are vendored Census boundaries (public/data/mi-counties.json,
 * refresh via scripts/vendor-census-counties.sh); counts come from
 * public/data/housecalls-map.json, written by the harvest pipeline. Until the
 * first harvest lands the counties sit dark at zero, which is the honest state.
 *
 * PII rule (docs/housecalls/maps-plan.md): this layer only ever renders
 * aggregates. Nothing below the county rollup reaches the browser.
 */

interface MapData {
  generated: string
  total: number
  note?: string
  counties: Record<string, number>
}

const SRC = "greatlakes"

// The same self-hosted tiles and ink-basemap idea as the airspace map, minus
// the aviation layers: water for the lake line, boundaries for context, and
// the county choropleth does the talking.
const huntStyle: StyleSpecification = {
  version: 8,
  sources: {
    [SRC]: { type: "vector", url: TILEJSON },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": MAP_INK.panelSunk } },
    {
      id: "water",
      type: "fill",
      source: SRC,
      "source-layer": "water",
      paint: { "fill-color": MAP_INK.oceanDeep, "fill-opacity": 0.35 },
    },
  ],
}

// count == 0 stays on panel ground (no data is not a magnitude); anything
// above zero climbs the one-hue sequential ramp, per the colour law.
const countExpr: ExpressionSpecification = ["coalesce", ["feature-state", "count"], 0]
const fillExpr: ExpressionSpecification = [
  "case",
  ["<=", countExpr, 0],
  MAP_INK.panel,
  ["interpolate", ["linear"], countExpr, ...mapRamp([1, 3, 8, 20, 50])],
] as unknown as ExpressionSpecification

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// match-expressions over the stage property; identity comes from pins.ts, so
// the writer and this layer can never disagree on a stage's look.
const stageMatch = (table: Record<PinStage, string | number>, fallback: string | number) =>
  ["match", ["get", "stage"], ...PIN_STAGES.flatMap((s) => [s, table[s]]), fallback] as unknown

function pinsToGeoJSON(file: PinFile): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: file.pins.map((p) => ({
      type: "Feature" as const,
      properties: {
        stage: p.stage,
        label: p.label,
        sector: p.sector,
        since: p.since,
        fact: p.fact,
        county: p.county,
      },
      geometry: { type: "Point" as const, coordinates: p.pos },
    })),
  }
}

export default function HuntMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [note, setNote] = useState<string>("")
  const [stageCounts, setStageCounts] = useState<Record<string, number> | null>(null)
  const [activeStages, setActiveStages] = useState<Set<PinStage>>(new Set(PIN_STAGES))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = new maplibregl.Map({
      container,
      style: huntStyle,
      center: GR_CENTER,
      zoom: 6.2,
      minZoom: 4.5,
      maxZoom: 11,
      attributionControl: false,
    })
    mapRef.current = map

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(container)
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "© OpenMapTiles · OpenStreetMap · US Census",
      }),
      "bottom-right"
    )

    let aborted = false
    map.on("load", async () => {
      try {
        const [countiesRes, dataRes, pinsRes] = await Promise.all([
          fetch("/data/mi-counties.json"),
          fetch("/data/housecalls-map.json"),
          fetch("/data/housecalls-pins.json"),
        ])
        const counties = await countiesRes.json()
        const data: MapData = await dataRes.json()
        // Pins are P2: tolerate the file being absent or malformed and run P1.
        const pinFile: PinFile = pinsRes.ok
          ? await pinsRes.json().catch(() => ({ generated: "", stages: [], pins: [] }))
          : { generated: "", stages: [], pins: [] }
        if (aborted || !mapRef.current) return

        map.addSource("counties", { type: "geojson", data: counties, promoteId: "geoid" })
        map.addLayer({
          id: "county-fill",
          type: "fill",
          source: "counties",
          paint: { "fill-color": fillExpr, "fill-opacity": 0.9 },
        })
        map.addLayer({
          id: "county-line",
          type: "line",
          source: "counties",
          paint: { "line-color": MAP_INK.rulePanel, "line-width": 1 },
        })

        // P2 stage pins: above the choropleth, below home base. Stage look
        // comes from pins.ts; radius is the secondary encoding so identity is
        // never color alone. The panel-sunk ring is the 2px surface gap that
        // keeps overlapping pins legible.
        map.addSource("pins", { type: "geojson", data: pinsToGeoJSON(pinFile) })
        map.addLayer({
          id: "pins",
          type: "circle",
          source: "pins",
          paint: {
            "circle-color": stageMatch(STAGE_COLOR, MAP_INK.glassMuted) as never,
            "circle-radius": stageMatch(STAGE_RADIUS, 3) as never,
            "circle-stroke-width": 2,
            "circle-stroke-color": MAP_INK.panelSunk,
          },
        })

        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        map.on("mouseenter", "pins", (e) => {
          map.getCanvas().style.cursor = "pointer"
          const f = e.features?.[0]
          if (!f) return
          const p = f.properties as Record<string, string | null>
          const rows = [
            `<b>${esc(p.label || "unnamed prospect")}</b>`,
            `${esc(String(p.stage))} since ${esc(String(p.since))}`,
            p.sector ? esc(p.sector) : null,
            p.fact ? esc(p.fact) : null,
          ].filter(Boolean)
          popup
            .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
            .setHTML(`<div class="beta-hc-pop">${rows.join("<br/>")}</div>`)
            .addTo(map)
        })
        map.on("mouseleave", "pins", () => {
          map.getCanvas().style.cursor = ""
          popup.remove()
        })

        const counts: Record<string, number> = {}
        for (const p of pinFile.pins) counts[p.stage] = (counts[p.stage] ?? 0) + 1
        setStageCounts(counts)

        // Home base: the one deliberate spot of ACTIVE blue on the board.
        map.addSource("home", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: GR_CENTER } },
        })
        map.addLayer({
          id: "home",
          type: "circle",
          source: "home",
          paint: {
            "circle-radius": 5,
            "circle-color": MAP_INK.ocean,
            "circle-stroke-width": 2,
            "circle-stroke-color": MAP_INK.glass,
          },
        })

        for (const [geoid, count] of Object.entries(data.counties)) {
          map.setFeatureState({ source: "counties", id: geoid }, { count })
        }
        setTotal(data.total)
        setNote(data.note ?? "")
      } catch {
        setNote("map data unavailable")
      }
    })

    return () => {
      aborted = true
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  const toggleStage = (s: PinStage) => {
    const next = new Set(activeStages)
    if (next.has(s)) next.delete(s)
    else next.add(s)
    setActiveStages(next)
    mapRef.current?.setFilter("pins", ["in", ["get", "stage"], ["literal", [...next]]] as never)
  }

  const havePins = stageCounts !== null && Object.values(stageCounts).some((n) => n > 0)

  return (
    <div className="beta-hc-map-wrap">
      <div ref={containerRef} className="beta-hc-map" aria-label="Prospect density by Michigan county" />
      <div className="beta-hc-map-note">
        <span>prospects mapped: {total ?? "…"}</span>
        {note ? <span className="beta-hc-map-note__gap">{note}</span> : null}
      </div>
      {/* Stage legend doubles as the filter. Toggling hides a stage's pins
          without recoloring the survivors (color follows the entity, never the
          filter). Hidden until the first pin exists. */}
      {havePins ? (
        <div className="beta-hc-legend" role="group" aria-label="Filter pins by stage">
          {PIN_STAGES.map((s) => (
            <button
              key={s}
              type="button"
              className="beta-hc-lg"
              aria-pressed={activeStages.has(s)}
              onClick={() => toggleStage(s)}
            >
              <span
                className="beta-hc-lg__dot"
                style={{ background: STAGE_COLOR[s], width: STAGE_RADIUS[s] + 3, height: STAGE_RADIUS[s] + 3 }}
                aria-hidden
              />
              {s} {stageCounts?.[s] ?? 0}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
