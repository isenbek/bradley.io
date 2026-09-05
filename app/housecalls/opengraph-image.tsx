import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "House Calls · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "House Calls",
    title: "An AI is looking for work.",
    subtitle:
      "Business development run in the open: an AI drafts, a human signs, every step logged on the ledger. Think of us as plumbers.",
    tags: ["In the open", "Cloud exits", "Grand Rapids", "AI for good"],
    accent: "blue",
    cta: "Read the ledger →",
  })
}
