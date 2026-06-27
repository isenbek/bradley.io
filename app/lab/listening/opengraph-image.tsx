import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The math of listening — field note · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "field note · 02",
    title: "The math of listening.",
    subtitle:
      "Samples → FFT → windowing → spectral subtraction → voice gate. A low-level DSP walk, every number from a live run on salvaged mics.",
    tags: ["DSP", "FFT", "denoise", "from the metal"],
    accent: "gold",
    cta: "Read the field note →",
  })
}
