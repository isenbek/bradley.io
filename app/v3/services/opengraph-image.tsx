import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Services — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Services",
    title: "Build what cloud-shaped consultants can't.",
    subtitle:
      "Distributed systems, data pipelines, edge & IoT, AI/ML integration. Project, hourly, or retainer.",
    tags: ["Architecture", "Data", "Edge/IoT", "AI/ML"],
    accent: "green",
    cta: "Book a call →",
  })
}
