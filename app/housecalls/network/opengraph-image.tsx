import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The House Calls network · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "House Calls",
    title: "The network. Population: one.",
    subtitle:
      "House Calls is a method, and methods replicate. The map of who runs the machine where, honest at every size.",
    tags: ["One operator", "Counties", "Rules that do not bend"],
    accent: "blue",
    cta: "See the map →",
  })
}
