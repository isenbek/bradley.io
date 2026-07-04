import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Fleet Health — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "worldsink · live",
    title: "The fleet, watched.",
    subtitle:
      "Per-node vitals, an attention layer that flags trouble, and a self-healing medic — for the collector fleet behind the WorldEvent bus.",
    tags: ["Fleet", "Live", "Health", "Self-healing"],
    accent: "coral",
    cta: "Check vitals →",
  })
}
