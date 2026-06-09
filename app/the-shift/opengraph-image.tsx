import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The Shift — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Thesis · the shift",
    title: "Teams → soloists. Sprints → streams.",
    subtitle:
      "How AI rewrites the economics of building software. Five sections of evidence, not vibes.",
    tags: ["Domain coverage", "Velocity", "Time", "Cache", "Compound"],
    accent: "coral",
    cta: "Read the thesis →",
  })
}
