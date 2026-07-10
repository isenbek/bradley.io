import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Bradley Isenbek · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "bio · bradley.io",
    title: "Hardware hacker. Data architect. AI pilot.",
    subtitle:
      "Building at the seam where enterprise scale meets maker culture: ESP32 mesh to Fortune-500 warehouses, with Claude as co-pilot.",
    tags: ["Anti-cloud", "Host local", "Think global"],
    accent: "blue",
    cta: "Explore bradley.io →",
  })
}
