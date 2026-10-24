import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Airspace Map · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "airspace · live map",
    title: "The sky over Grand Rapids, mapped.",
    sentence:
      "Live ADS-B aircraft, a 15-minute density forecast, trajectory ribbons, and a signal-strength bloom, on a self-hosted vector basemap.",
  })
}
