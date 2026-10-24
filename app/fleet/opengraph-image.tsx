import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Fleet Health · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "worldsink · live",
    title: "The fleet, watched.",
    sentence:
      "Per-node vitals, an attention layer that flags trouble, and a self-healing medic, for the collector fleet behind the WorldEvent bus.",
  })
}
