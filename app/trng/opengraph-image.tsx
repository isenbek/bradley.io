import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "TRNG · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "hotbits · live entropy",
    title: "Random, from radioactive decay.",
    sentence:
      "A Geiger counter and a Raspberry Pi time radioactive decay and turn it into random bits, tested the way NIST tests them.",
  })
}
