import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Resume of Bradley S. Isenbek · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Resume",
    title: "Bradley S. Isenbek.",
    subtitle:
      "AI systems architect and machine learning engineer. Secure, large-scale data systems since 1997.",
    tags: ["Grand Rapids, MI", "AI + data systems", "Government + enterprise"],
    accent: "blue",
    cta: "Read the resume →",
  })
}
