import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "Zeta Forge: an interactive builder for the zeta function, one term at a time. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "zeta forge · frontier math",
    title: "Build zeta one arrow at a time.",
    sentence:
      "Every term is an arrow. Laid head to tail they walk the complex plane, and where the walk lands is the value of zeta. A zero is the walk that comes home.",
  })
}
