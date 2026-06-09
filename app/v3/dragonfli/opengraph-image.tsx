import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Dragonfli — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "dragonfli · live ADS-B",
    title: "Watch the sky, locally.",
    subtitle:
      "A 1090 MHz receiver, an FAA registry lookup, and a trajectory predictor — running in the garage.",
    tags: ["ADS-B", "1090 MHz", "FAA registry", "Predictor"],
    accent: "blue",
    cta: "Watch the skies →",
  })
}
