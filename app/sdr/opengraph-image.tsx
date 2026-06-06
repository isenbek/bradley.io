import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "SDR API — Software-defined radio scanner stack"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "sdr-api",
    title: "The spectrum, indexed.",
    subtitle:
      "Live status for the SDR scanner stack — band registry, soak archive, top frequencies, and job history from rtl-sdr.",
    tags: ["RTL-SDR", "Live", "Spectrum", "Archive"],
    accent: "orange",
    cta: "Tune in →",
  })
}
