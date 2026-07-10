import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Projects · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Projects",
    title: "86+ things on the bench.",
    subtitle:
      "Hardware, AI, data pipelines, distributed systems, frontier research. Most shipped with Claude as co-pilot.",
    tags: ["Hardware", "AI/ML", "Data", "Systems", "Research"],
    accent: "blue",
    cta: "Browse the lot →",
  })
}
