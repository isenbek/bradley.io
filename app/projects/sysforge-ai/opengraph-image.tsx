import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"
import { loadMissionTimeline, missionTags } from "../_timeline/mission-og"

export const runtime = "nodejs"
export const alt = "Sysforge-AI: Timeline"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const t = loadMissionTimeline("sysforge-ai-timeline.json")

  return ogV3ImageResponse({
    eyebrow: "Consulting timeline",
    title: "Sysforge-AI.",
    subtitle:
      "AI consulting & development firm. Frontier LLM integrations, agentic pipelines, AI-augmented dev toolchains shipped to enterprise clients.",
    tags: t ? missionTags(t) : ["Consulting"],
    accent: "coral",
    cta: "Read the timeline →",
  })
}
