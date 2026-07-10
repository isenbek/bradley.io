import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "Turfy, a fail-safe AI irrigation sidecar, with a photo of the 1990s Rain Bird controller's dial. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const photo = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/turfy/og-card.png")
  ).toString("base64")}`
  return ogV3ImageResponse({
    eyebrow: "turfy · irrigation sidecar · v0.1",
    title: "Waters the lawn only when it's provably healthy.",
    subtitle:
      "A fail-safe AI sidecar for a 1990s Rain Bird. It only takes over while its watchdog is fed.",
    tags: ["Raspberry Pi", "24VAC", "transfer relays", "555 watchdog"],
    accent: "green",
    cta: "Read the build →",
    image: photo,
    imageFrame: true,
  })
}
