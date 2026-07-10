import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Airspace Map · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "airspace · live map",
    title: "The sky over Grand Rapids, mapped.",
    subtitle:
      "Live ADS-B aircraft, a 15-minute density forecast, trajectory ribbons, and a signal-strength bloom, on a self-hosted vector basemap.",
    tags: ["MapLibre", "ADS-B", "density", "vector tiles"],
    accent: "blue",
    cta: "Open the map →",
  })
}
