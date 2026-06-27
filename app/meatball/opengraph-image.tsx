import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Meatball — the sensory machine · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "project · the sensory machine",
    title: "Meatball can see, hear, and talk back.",
    subtitle:
      "A caseless home server of salvaged parts — '60s mics, thrift-store everything, early-'90s Altec Lansings — that learned to see, hear, think, and speak. Every model on the metal.",
    tags: ["anti-cloud", "vision", "STT+TTS", "salvage"],
    accent: "gold",
    cta: "Meet the machine →",
  })
}
