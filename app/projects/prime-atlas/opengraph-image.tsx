import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "Primality Atlas: an interactive terrain map of prime-number theory. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "primality atlas · frontier math",
    title: "A terrain map of the territory around the primes.",
    subtitle:
      "Twenty-nine landmarks across proven ground, conjectured pasture, dark rooms, and the cliffs proven impassable. Euler spring to parity cliff.",
    tags: ["Riemann", "parity barrier", "29 landmarks", "pan · zoom"],
    accent: "blue",
    cta: "Explore the map →",
  })
}
