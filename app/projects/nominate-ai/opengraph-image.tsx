import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"
import { loadMissionTimeline, missionTags } from "../_timeline/mission-og"

export const runtime = "nodejs"
export const alt = "Nominate-AI: Platform Timeline"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const t = loadMissionTimeline("nominate-ai-timeline.json")

  return ogV3ImageResponse({
    eyebrow: "Platform timeline",
    title: "Nominate-AI.",
    subtitle:
      "The AI-native sourcing platform: multi-tenant pipelines, vector search, agent orchestration, and the messaging layer that powers it all.",
    tags: t ? missionTags(t) : ["Platform"],
    accent: "blue",
    cta: "Read the timeline →",
  })
}
