import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "I gave a junk-pile eyes, ears, and a voice · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "lab · field notes",
    title: "I gave a junk-pile eyes, ears, and a voice.",
    subtitle:
      "A caseless home server of salvaged parts ('60s mics, thrift-store everything, early-'90s Altec Lansings) taught to see, hear, think, and speak. Every model on the metal.",
    tags: ["anti-cloud", "STT+TTS", "vision", "salvage"],
    accent: "gold",
    cta: "Read the field notes →",
  })
}
