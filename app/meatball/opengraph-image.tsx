import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Meatball: the sensory machine · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const mascot = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/meatball-mascot.png")
  ).toString("base64")}`
  return ogV3ImageResponse({
    eyebrow: "project · the sensory machine",
    title: "Meatball can see, hear, and talk back.",
    subtitle:
      "A junk-pile home server that learned to see, hear, think, and speak. Every model on the metal.",
    tags: ["anti-cloud", "vision", "STT+TTS", "salvage"],
    accent: "gold",
    cta: "Meet the machine →",
    image: mascot,
  })
}
