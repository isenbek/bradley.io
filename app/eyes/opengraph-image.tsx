import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Eyes — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "live · eyes",
    title: "A frame, once a minute.",
    subtitle:
      "A self-hosted frame grab from the attached camera — cached on the box, refreshed every minute. No stream, no cloud.",
    tags: ["v4l2", "ffmpeg", "systemd", "self-hosted"],
    accent: "blue",
    cta: "See the latest frame →",
  })
}
