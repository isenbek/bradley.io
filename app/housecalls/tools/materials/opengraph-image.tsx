import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The voice material pad, free · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "House Calls · free tools",
    title: "Say the list. Hand over the list.",
    subtitle:
      "Talk materials into the phone, get a clean supply-house list. The clever part is honestly not AI, and the page says so.",
    tags: ["Free forever", "Voice or typed", "No signup"],
    accent: "blue",
    cta: "Open the pad →",
  })
}
