import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "About Bradley Isenbek — AI Systems Architect & Frontier Technologist"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "About",
    title: "Bradley S. Isenbek",
    subtitle:
      "AI Systems Architect, hardware hacker, and frontier technologist building at the intersection of enterprise scale and maker culture.",
    tags: ["Grand Rapids, MI", "15+ years", "AI · Data · IoT"],
    accent: "cyan",
  })
}
