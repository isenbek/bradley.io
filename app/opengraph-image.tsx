import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "Bradley Isenbek, Grand Rapids, Michigan: AI pilot, data architect, hardware hacker. Open to full-time roles in AI systems and data architecture."
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

/** The home card, in the kit's style: the hero's words, as the page opens. */
export default function OG() {
  return ogKitImageResponse({
    eyebrow: "Bradley Isenbek · Grand Rapids, Michigan",
    lines: ["AI pilot.", "Data architect.", "Hardware hacker."],
    sentence: "Open to full-time roles in AI systems and data architecture.",
    foot: "ANTI-CLOUD · HOST LOCAL",
  })
}
