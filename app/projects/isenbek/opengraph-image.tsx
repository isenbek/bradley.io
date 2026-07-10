import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"
import { loadMissionTimeline, missionTags } from "../_timeline/mission-og"

export const runtime = "nodejs"
export const alt = "isenbek: Personal Timeline"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const t = loadMissionTimeline("isenbek-timeline.json")

  return ogV3ImageResponse({
    eyebrow: "Personal timeline",
    title: "isenbek.",
    subtitle:
      "The solo namespace. Side projects, learning exercises, the through-line: repos that track the career arc across every platform and lab.",
    tags: t ? missionTags(t) : ["Personal"],
    accent: "green",
    cta: "Read the timeline →",
  })
}
