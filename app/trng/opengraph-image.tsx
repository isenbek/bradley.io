import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "TRNG — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "hotbits · live entropy",
    title: "Random, from radioactive decay.",
    subtitle:
      "A CAJOE Geiger counter, a Raspberry Pi, and a Δt₁/Δt₂ comparison turn cosmic noise into NIST-tested bits.",
    tags: ["Geiger", "Δt₁/Δt₂", "SHA-256", "NIST"],
    accent: "green",
    cta: "Watch the entropy →",
  })
}
