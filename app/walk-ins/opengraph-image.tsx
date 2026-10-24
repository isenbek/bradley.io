import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Walk-ins · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "Walk-ins",
    title: "A resume, a five-mile circle, and every door.",
    sentence:
      "The full-time search as it happens: one sheet built from live data, the companies within five miles of home, and the whole Claude Code record, logged in the open.",
  })
}
