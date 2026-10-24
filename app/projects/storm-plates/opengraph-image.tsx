import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "Storm Plates: the prime sieve drawn as wave interference, in six interactive plates. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "storm plates · frontier math",
    title: "The sieve, drawn as weather.",
    sentence:
      "One wave per prime rolls under a plank bridge. Every crest breaks the plank it lands on, and the planks left standing are the primes.",
  })
}
