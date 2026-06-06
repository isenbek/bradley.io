import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Lab — Frontier experiments in hardware, AI, and creative computing"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "The Lab",
    title: "Frontier experiments.",
    subtitle:
      "Boundary-pushing research projects — hardware, AI, and creative computing — that explore what's possible.",
    tags: ["Experiments", "Hardware", "AI", "Creative"],
    accent: "purple",
  })
}
