import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "Turfy, the design for a fail-safe AI irrigation sidecar, with a photo of the 1990s Rain Bird controller's dial. bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const photo = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/turfy/og-card.png")
  ).toString("base64")}`
  return ogV3ImageResponse({
    eyebrow: "turfy · irrigation sidecar · v0.1 design",
    title: "An AI sprinkler brain that fails back to dumb.",
    subtitle:
      "The design for a fail-safe sidecar for a 1990s Rain Bird: it takes over only while a hardware watchdog is fed.",
    tags: ["Raspberry Pi", "24VAC", "transfer relays", "555 watchdog"],
    accent: "green",
    cta: "Read the design →",
    image: photo,
    imageFrame: true,
  })
}
