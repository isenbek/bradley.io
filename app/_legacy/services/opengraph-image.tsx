import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Consulting Services — Data Engineering, AI/ML, Edge Computing"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "Consulting",
    title: "Engineering for the frontier.",
    subtitle:
      "Data architecture, distributed systems, AI integration, and edge computing — project, hourly, or retainer.",
    tags: ["Data Engineering", "AI / ML", "Edge & IoT", "Architecture"],
    accent: "orange",
    cta: "Book a call →",
  })
}
