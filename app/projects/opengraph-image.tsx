import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Projects · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Projects",
    title: "What is on the bench.",
    subtitle:
      "Chips rebuilt from their own dies, instruments reading real hardware, and math you can operate.",
    tags: ["Chips", "Platforms", "Instruments", "Math"],
    accent: "blue",
    cta: "See the bench →",
  })
}
