import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Turfy — a fail-safe AI irrigation sidecar — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "turfy · irrigation sidecar · v0.1",
    title: "Waters the lawn only when it's provably healthy.",
    subtitle:
      "An AI sidecar for a 1990s Rain Bird. It takes authority only while its watchdog is fed — any failure falls back to the dumb controller, in hardware.",
    tags: ["Raspberry Pi", "24VAC", "transfer relays", "555 watchdog", "ET scheduling"],
    accent: "green",
    cta: "Read the build →",
  })
}
