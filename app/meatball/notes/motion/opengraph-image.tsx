import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Teaching the eyes to ignore a box fan: field note · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "field note · 03",
    title: "Teaching the eyes to ignore a box fan.",
    sentence:
      "Lock the camera, then let every cell set its own bar. An adaptive motion gate that self-mutes a fan, monitors, and lighting blips.",
  })
}
