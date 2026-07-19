import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "Zeta Forge: an interactive builder for the zeta function, one term at a time. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "zeta forge · frontier math",
    title: "Build zeta one arrow at a time.",
    subtitle:
      "Every term is an arrow. Laid head to tail they walk the complex plane, and where the walk lands is ζ(s). A zero is the walk that comes home.",
    tags: ["ζ(s) = Σ n⁻ˢ", "continuation", "the critical strip", "canvas"],
    accent: "blue",
    cta: "Forge it →",
  })
}
