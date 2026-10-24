import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Terminal · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "Terminal · interactive CLI",
    title: "$ whoami",
    sentence:
      "Poke around the portfolio the old-fashioned way. Type help, hit enter, see what happens.",
  })
}
