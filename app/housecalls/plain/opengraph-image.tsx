import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "House Calls, in plain English · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "House Calls",
    title: "The plain-English version.",
    sentence:
      "What is changing in the computer world, why your technology costs should be going down instead of up, and what we are doing about it.",
  })
}
