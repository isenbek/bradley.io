import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "I gave a junk-pile eyes, ears, and a voice · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "lab · field notes",
    title: "I gave a junk-pile eyes, ears, and a voice.",
    sentence:
      "A caseless home server of salvaged parts ('60s mics, thrift-store everything, early-'90s Altec Lansings) taught to see, hear, think, and speak. Every model on the metal.",
  })
}
