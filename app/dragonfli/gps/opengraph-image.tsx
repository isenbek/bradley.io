import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "GPS — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "gps · live",
    title: "The sky, from the ground up.",
    subtitle:
      "Live satellite skyplot by SNR, the signal spectrum, the fix-precision cloud, and the ground track — off the Dragonfli receiver.",
    tags: ["GNSS", "skyplot", "SNR", "gpsd"],
    accent: "blue",
    cta: "Open the GPS board →",
  })
}
