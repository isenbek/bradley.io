import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The math of listening: field note · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "field note · 02",
    title: "The math of listening.",
    sentence:
      "From raw sound samples to a voice gate, one step at a time, with every number from a live run on salvaged mics.",
  })
}
