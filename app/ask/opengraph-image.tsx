import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Ask about Bradley Isenbek: Claude, an AI, answering from his resume"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

// What the page says about itself: an AI, the resume as its only source, and
// the resume as the record.
export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Ask",
    title: "Ask about Bradley.",
    subtitle: "Claude, an AI, answering from his resume and this site, with links to the evidence. The resume is the record.",
    tags: ["Claude", "From the resume", "Grand Rapids, MI"],
    accent: "blue",
    cta: "Ask a question →",
  })
}
