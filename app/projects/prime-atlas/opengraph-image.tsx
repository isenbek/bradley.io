import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "Primality Atlas: an interactive terrain map of prime-number theory. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "primality atlas · frontier math",
    title: "A terrain map of the territory around the primes.",
    sentence:
      "Twenty-nine landmarks across proven ground, conjectured pasture, dark rooms, and the cliffs proven impassable. Euler spring to parity cliff.",
  })
}
