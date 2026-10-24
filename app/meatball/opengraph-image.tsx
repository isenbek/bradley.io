import { readFileSync } from "fs"
import { join } from "path"
import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Meatball: the sensory machine · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  const mascot = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/meatball-mascot.png")
  ).toString("base64")}`
  return ogKitImageResponse({
    eyebrow: "project · the sensory machine",
    title: "Meatball can see, hear, and talk back.",
    sentence:
      "A junk-pile home server that learned to see, hear, think, and speak. Every model on the metal.",
    image: mascot,
  })
}
