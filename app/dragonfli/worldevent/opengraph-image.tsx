import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "WorldEvent bus — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "worldevent · live",
    title: "Every sense, one firehose.",
    subtitle:
      "A live, schema-tagged perception bus — every event type, host, and rate on one wire. New senses just appear.",
    tags: ["worldevent/1", "UDP :31415", "perception", "live"],
    accent: "blue",
    cta: "Open the WorldEvent bus →",
  })
}
