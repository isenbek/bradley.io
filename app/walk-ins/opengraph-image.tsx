import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Walk-ins · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Walk-ins",
    title: "A resume, a five-mile circle, and every door.",
    subtitle:
      "The full-time search as it happens: one sheet built from live data, the companies within five miles of home, and the whole Claude Code record, logged in the open.",
    tags: ["In the open", "Kentwood, Michigan", "AI systems", "Hiring?"],
    accent: "blue",
    cta: "Read the log →",
  })
}
