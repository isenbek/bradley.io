import { readFileSync } from "fs"
import { join } from "path"
import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "Turfy, the design for a fail-safe AI irrigation sidecar, with a photo of the 1990s Rain Bird controller's dial. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  const photo = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/turfy/og-card.png")
  ).toString("base64")}`
  return ogKitImageResponse({
    eyebrow: "turfy · irrigation sidecar · v0.1 design",
    title: "An AI sprinkler brain that fails back to dumb.",
    sentence:
      "The design for a fail-safe sidecar for a 1990s Rain Bird: it takes over only while a hardware watchdog is fed.",
    image: photo,
    imageFrame: true,
  })
}
