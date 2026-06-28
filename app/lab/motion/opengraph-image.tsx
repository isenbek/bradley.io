import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Teaching the eyes to ignore a box fan — field note · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "field note · 03",
    title: "Teaching the eyes to ignore a box fan.",
    subtitle:
      "Lock the camera, then let every cell set its own bar. An adaptive motion gate that self-mutes a fan, monitors, and lighting blips.",
    tags: ["motion", "v4l2 lock", "adaptive gate", "from the metal"],
    accent: "blue",
    cta: "Read the field note →",
  })
}
