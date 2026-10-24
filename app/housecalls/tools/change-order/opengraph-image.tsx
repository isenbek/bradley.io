import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The change-order pad, free · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "House Calls · free tools",
    title: "Get the change signed.",
    sentence:
      "Describe it, photograph it, price it, and get the signature before the work. No account, nothing leaves the phone.",
  })
}
