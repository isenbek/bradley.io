import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The job photo stamper, free · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "House Calls · free tools",
    title: "The photo is the proof.",
    sentence:
      "Job label, time, and GPS burned into every photo. Grouped by job, out as one zip. Nothing uploads.",
  })
}
