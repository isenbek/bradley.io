import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Lab · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const photo = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/lab/og-card.png")
  ).toString("base64")}`
  return ogV3ImageResponse({
    eyebrow: "Lab · frontier experiments",
    title: "Things that might not ship.",
    subtitle: "Hardware hacks, signal toys, and AI agents off the leash.",
    tags: ["Hardware", "AI", "Signals", "Creative"],
    accent: "gold",
    cta: "Step inside →",
    image: photo,
    imageFrame: true,
  })
}
