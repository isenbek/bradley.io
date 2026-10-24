import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The voice material pad, free · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "House Calls · free tools",
    title: "Say the list. Hand over the list.",
    sentence:
      "Talk materials into the phone, get a clean supply-house list. The clever part is honestly not AI, and the page says so.",
  })
}
