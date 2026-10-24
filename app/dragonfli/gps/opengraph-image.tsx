import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "GPS · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "gps · live",
    title: "The sky, from the ground up.",
    sentence:
      "Live satellite skyplot by SNR, the signal spectrum, the fix-precision cloud, and the ground track, off the Dragonfli receiver.",
  })
}
