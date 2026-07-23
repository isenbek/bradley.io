import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "Storm Plates: the prime sieve drawn as wave interference, in six interactive plates. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "storm plates · frontier math",
    title: "The sieve, drawn as weather.",
    subtitle:
      "One wave per prime rolls under a plank bridge. Every crest breaks the plank it lands on, and the planks left standing are the primes.",
    tags: ["one swell per prime", "record gaps", "twin nodes", "canvas"],
    accent: "blue",
    cta: "Watch the water →",
  })
}
