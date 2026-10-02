import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "About Bradley Isenbek, AI systems architect in Grand Rapids, Michigan"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

// The same facts the page states: the resume's headline role, the first role's
// year, and the Philosophy section's "garage lab" and local hosting.
export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "About",
    title: "Bradley S. Isenbek.",
    subtitle:
      "AI systems architect. Production systems since 1997, and a garage lab where everything is hosted locally.",
    tags: ["Grand Rapids, MI", "Since 1997", "Host local"],
    accent: "coral",
    cta: "Read the story →",
  })
}
