"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TILEJSON, GR_CENTER } from "@/components/dragonfli/airspace/style"
import { MAP_INK, mapRamp } from "@/lib/beta/chart-theme"

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

export default function HuntMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [note, setNote] = useState<string>("")

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
        const [countiesRes, dataRes] = await Promise.all([
          fetch("/data/mi-counties.json"),
          fetch("/data/housecalls-map.json"),
        ])
        const counties = await countiesRes.json()
        const data: MapData = await dataRes.json()
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

  return (
    <div className="beta-hc-map-wrap">
      <div ref={containerRef} className="beta-hc-map" aria-label="Prospect density by Michigan county" />
      <div className="beta-hc-map-note">
        <span>prospects mapped: {total ?? "…"}</span>
        {note ? <span className="beta-hc-map-note__gap">{note}</span> : null}
      </div>
    </div>
  )
}
