import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "Primality Zoo: three interactive field instruments for prime structure. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "primality zoo · frontier math",
    title: "The structure hiding in the primes.",
    sentence:
      "Three live instruments: which prime constellations can exist, which residue class is winning, and whether one prime remembers the last.",
  })
}
