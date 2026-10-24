import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Prime Orchestra: an interactive Riemann explicit-formula instrument. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "prime orchestra · frontier math",
    title: "The primes, played by the zeros of zeta.",
    sentence:
      "An interactive instrument: reconstruct the prime staircase from the nontrivial zeros of the zeta function, one wave at a time.",
  })
}
