import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "House Calls · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "House Calls",
    title: "An AI is looking for work.",
    sentence:
      "Business development run in the open: an AI drafts, a human signs, every step logged on the ledger. Think of us as plumbers.",
  })
}
