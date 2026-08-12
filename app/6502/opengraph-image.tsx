import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The 6502, switch by switch · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "preservation · silicon archaeology",
    title: "The 6502, switch by switch.",
    subtitle:
      "A 1975 processor simulated from a photograph of its own die, and a link-checked archive of everything around it.",
    tags: ["3,510 switches", "83,227 triangles", "visual6502", "archive"],
    accent: "blue",
    cta: "Run the chip →",
  })
}
