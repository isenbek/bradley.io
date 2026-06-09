import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "SDR — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "sdr-api · live",
    title: "The spectrum, indexed.",
    subtitle:
      "Band registry, soak archive, top frequencies, and job history — straight from the rtl-sdr scanner stack.",
    tags: ["RTL-SDR", "Live", "Spectrum", "Archive"],
    accent: "coral",
    cta: "Tune in →",
  })
}
