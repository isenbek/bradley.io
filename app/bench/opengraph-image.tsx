import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The bench · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

// No counts and no status on the card: it is cached for days, and what is up
// on the bench changes by the minute.
export default function OG() {
  return ogKitImageResponse({
    eyebrow: "The bench",
    title: "Is it up, and where is it.",
    sentence:
      "Every page this server serves, and whether the hardware behind each instrument is answering right now.",
  })
}
