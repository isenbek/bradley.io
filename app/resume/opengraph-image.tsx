import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Resume of Bradley S. Isenbek · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "Resume",
    title: "Bradley S. Isenbek.",
    sentence:
      "AI systems architect and machine learning engineer. Open to full-time roles in AI systems and data architecture.",
  })
}
