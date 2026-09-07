import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The job photo stamper, free · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "House Calls · free tools",
    title: "The photo is the proof.",
    subtitle:
      "Job label, time, and GPS burned into every photo. Grouped by job, out as one zip. Nothing uploads.",
    tags: ["Free forever", "Stamped in pixels", "No signup"],
    accent: "blue",
    cta: "Open the stamper →",
  })
}
