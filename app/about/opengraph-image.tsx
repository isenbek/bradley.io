import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "About Bradley Isenbek, AI systems architect in Grand Rapids, Michigan"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

// The same facts the page states: the resume's headline role, the first role's
// year, and the Philosophy section's "garage lab" and local hosting.
export default function OG() {
  return ogKitImageResponse({
    eyebrow: "About",
    title: "Bradley S. Isenbek.",
    sentence:
      "AI systems architect. Production systems since 1997, and a garage lab where everything is hosted locally.",
  })
}
