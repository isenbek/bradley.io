import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "WorldEvent bus · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "worldevent · live",
    title: "Every sense, one firehose.",
    sentence:
      "A live, schema-tagged perception bus: every event type, host, and rate on one wire. New senses just appear.",
  })
}
