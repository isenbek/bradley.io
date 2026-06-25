import type { StyleSpecification } from "maplibre-gl"

// The self-hosted great-lakes vector tiles from tinymachines/adsb (planetiler,
// OpenMapTiles schema). CORS is open, so MapLibre reads the TileJSON directly.
export const TILEJSON = "https://dragonfli.tinymachines.ai/tiles/services/great-lakes"

// Grand Rapids receiver — fallback center when /receiver has no GPS fix.
export const GR_CENTER: [number, number] = [-85.67, 42.96]

const SRC = "greatlakes"

// A dark "ink" basemap so aircraft glyphs, the density heatmap, and trajectory
// ribbons read cleanly on top. No text layers → no glyph/sprite dependency.
// Aeroway (runways/taxiways) is highlighted — it's an aviation map, after all.
export const airspaceStyle: StyleSpecification = {
  version: 8,
  sources: {
    [SRC]: { type: "vector", url: TILEJSON },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#070d14" } },
    {
      id: "landcover",
      type: "fill",
      source: SRC,
      "source-layer": "landcover",
      paint: { "fill-color": "#0c1722", "fill-opacity": 0.45 },
    },
    {
      id: "park",
      type: "fill",
      source: SRC,
      "source-layer": "park",
      paint: { "fill-color": "#0d2019", "fill-opacity": 0.5 },
    },
    {
      id: "water",
      type: "fill",
      source: SRC,
      "source-layer": "water",
      paint: { "fill-color": "#091a29" },
    },
    {
      id: "waterway",
      type: "line",
      source: SRC,
      "source-layer": "waterway",
      paint: { "line-color": "#11324a", "line-width": 0.6 },
    },
    {
      id: "roads",
      type: "line",
      source: SRC,
      "source-layer": "transportation",
      paint: {
        "line-color": "#1a2c3a",
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.25, 12, 1.3],
      },
    },
    {
      id: "roads-major",
      type: "line",
      source: SRC,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
      paint: {
        "line-color": "#274a61",
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.6, 12, 2.4],
      },
    },
    {
      id: "aeroway",
      type: "line",
      source: SRC,
      "source-layer": "aeroway",
      paint: {
        "line-color": "#2f86ad",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 13, 3.5],
      },
    },
    {
      id: "boundary",
      type: "line",
      source: SRC,
      "source-layer": "boundary",
      filter: ["<=", ["get", "admin_level"], 4],
      paint: { "line-color": "#21384a", "line-width": 0.6, "line-dasharray": [2, 2] },
    },
  ],
}
