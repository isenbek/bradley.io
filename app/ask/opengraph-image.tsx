import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Ask about Bradley Isenbek: Claude, an AI, answering from his resume"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

// What the page says about itself: an AI, the resume as its only source, and
// the resume as the record.
export default function OG() {
  return ogKitImageResponse({
    eyebrow: "Ask",
    title: "Ask about Bradley.",
    sentence: "Claude, an AI, answering from his resume and this site, with links to the evidence. The resume is the record.",
  })
}
