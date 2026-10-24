import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The bio mark: vector x-ray · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "Lab · vector x-ray",
    title: "The Bio Mark",
    sentence:
      "The bio wordmark, taken apart: its chords, curve handles, anchors and the plumb line of the i. You can drag it.",
  })
}
