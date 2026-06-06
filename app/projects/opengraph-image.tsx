import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Projects — Hardware, AI, Data Pipelines, Distributed Systems"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "Projects",
    title: "Built in the open.",
    subtitle:
      "Hardware experiments, AI systems, data pipelines, and frontier research — every project shipped with Claude as co-pilot.",
    tags: ["Hardware", "AI", "Data", "Research"],
    accent: "cyan",
  })
}
