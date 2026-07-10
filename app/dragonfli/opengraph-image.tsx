import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "Dragonfli: a live ADS-B radar scope with range rings and aircraft plotted around the receiver. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const scope = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/dragonfli/og-card.png")
  ).toString("base64")}`
  return ogV3ImageResponse({
    eyebrow: "dragonfli · live ADS-B",
    title: "Watch the sky, locally.",
    subtitle: "A 1090 MHz receiver and a trajectory predictor, running in the garage.",
    tags: ["ADS-B", "1090 MHz", "FAA registry", "Predictor"],
    accent: "blue",
    cta: "Watch the skies →",
    image: scope,
    imageFrame: true,
  })
}
