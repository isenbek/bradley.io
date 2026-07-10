import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"
import { loadMissionTimeline, missionTags } from "../_timeline/mission-og"

export const runtime = "nodejs"
export const alt = "tinymachines: Lab Timeline"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  const t = loadMissionTimeline("tinymachines-timeline.json")

  return ogV3ImageResponse({
    eyebrow: "Lab umbrella",
    title: "tinymachines.",
    subtitle:
      "The garage-lab umbrella. ESP32 mesh, software-defined radio, true randomness from radioactive decay, ADS-B receivers. Hardware meets AI.",
    tags: t ? missionTags(t) : ["Lab"],
    accent: "gold",
    cta: "Tour the lab →",
  })
}
