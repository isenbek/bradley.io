import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The Shift · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "Thesis · the shift",
    title: "Teams to soloists. Sprints to streams.",
    sentence:
      "How AI rewrites the economics of building software. Five sections of evidence, not vibes.",
  })
}
