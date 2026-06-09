import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Contact — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Contact",
    title: "Drop me a line.",
    subtitle:
      "Email, GitHub, or just a sketch. Replies within ~24h, weekends not guaranteed.",
    tags: ["brad@bradley.io", "Grand Rapids, MI", "~24h reply"],
    accent: "blue",
    cta: "Say hello →",
  })
}
