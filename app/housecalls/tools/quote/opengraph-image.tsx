import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The truck quote pad, free · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "House Calls · free tools",
    title: "Quote it from the truck.",
    sentence:
      "Line items in, a professional quote out: print it or text it. No account, no signup, nothing leaves your phone.",
  })
}
