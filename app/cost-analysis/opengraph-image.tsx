import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Cost Analysis — Human-AI engineering economics"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "Cost Analysis",
    title: "9 months in 3 days.",
    subtitle:
      "Real numbers behind human-AI engineering — token spend, velocity multiplier, and the economic case for the new stack.",
    tags: ["Economics", "Velocity", "AI", "Live"],
    accent: "amber",
  })
}
