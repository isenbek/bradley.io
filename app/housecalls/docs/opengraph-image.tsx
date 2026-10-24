import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "House Calls: the paperwork · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "House Calls",
    title: "The paperwork, in the open too.",
    sentence:
      "Every plan, letter template, rule, and recipe behind the hunt, rendered from the same committed files the repo carries.",
  })
}
