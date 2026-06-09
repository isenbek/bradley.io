import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "About Bradley Isenbek — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "About",
    title: "Bradley S. Isenbek.",
    subtitle:
      "AI Systems Architect & frontier technologist. 15+ years from secure data systems to mesh radios.",
    tags: ["Grand Rapids, MI", "15+ years", "Hardware → AI"],
    accent: "coral",
    cta: "Read the story →",
  })
}
