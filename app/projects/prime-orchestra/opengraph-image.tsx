import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Prime Orchestra: an interactive Riemann explicit-formula instrument. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "prime orchestra · frontier math",
    title: "The primes, played by the zeros of zeta.",
    subtitle:
      "An interactive instrument: reconstruct the prime staircase from the nontrivial zeros of the zeta function, one wave at a time.",
    tags: ["Riemann ζ", "explicit formula", "300 zeros", "canvas"],
    accent: "blue",
    cta: "Play the instrument →",
  })
}
