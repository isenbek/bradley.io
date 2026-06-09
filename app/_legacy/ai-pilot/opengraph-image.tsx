import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "AI Pilot License Dashboard — Live Claude usage analytics"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "AI Pilot",
    title: "Flight hours, logged.",
    subtitle:
      "Live analytics of Claude AI usage — activity heatmaps, competency ratings, token economy, and piloting style.",
    tags: ["Claude", "Live data", "Heatmaps", "Token economy"],
    accent: "purple",
    cta: "Open dashboard →",
  })
}
