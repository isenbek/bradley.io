import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "Primality Zoo: three interactive field instruments for prime structure. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "primality zoo · frontier math",
    title: "The structure hiding in the primes.",
    subtitle:
      "Three live instruments: which prime constellations can exist, which residue class is winning, and whether one prime remembers the last.",
    tags: ["admissibility", "Chebyshev bias", "gap matrix", "2M sieve"],
    accent: "blue",
    cta: "Open the zoo →",
  })
}
