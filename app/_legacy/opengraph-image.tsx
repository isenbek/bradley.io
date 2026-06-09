import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Bradley Isenbek — Hardware hacker, data architect, AI pilot"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "Frontier Technologist",
    title: "Hardware. Data. AI.",
    subtitle:
      "Bradley Isenbek — building at the intersection of enterprise scale and maker culture, with Claude as co-pilot.",
    tags: ["ESP32", "Distributed Systems", "Claude", "Edge"],
    accent: "cyan",
    cta: "Explore bradley.io →",
  })
}
