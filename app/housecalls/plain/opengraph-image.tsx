import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "House Calls, in plain English · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "House Calls",
    title: "The plain-English version.",
    subtitle:
      "What is changing in the computer world, why your technology costs should be going down instead of up, and what we are doing about it.",
    tags: ["No jargon", "Costs down", "Fair prices"],
    accent: "blue",
    cta: "Read it →",
  })
}
