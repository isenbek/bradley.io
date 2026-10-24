import { readFileSync } from "fs"
import { join } from "path"
import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "Dragonfli: a live ADS-B radar scope with range rings and aircraft plotted around the receiver. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  const scope = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/dragonfli/og-card.png")
  ).toString("base64")}`
  return ogKitImageResponse({
    eyebrow: "dragonfli · live ADS-B",
    title: "Watch the sky, locally.",
    sentence: "A 1090 MHz receiver and a trajectory predictor, running in the garage.",
    image: scope,
    imageFrame: true,
  })
}
