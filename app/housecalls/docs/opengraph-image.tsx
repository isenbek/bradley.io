import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "House Calls: the paperwork · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "House Calls",
    title: "The paperwork, in the open too.",
    subtitle:
      "Every plan, letter template, rule, and recipe behind the hunt, rendered from the same committed files the repo carries.",
    tags: ["Plans", "Letters", "Rules", "Recipes"],
    accent: "blue",
    cta: "Read it →",
  })
}
