import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The change-order pad, free · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "House Calls · free tools",
    title: "Get the change signed.",
    subtitle:
      "Describe it, photograph it, price it, and get the signature before the work. No account, nothing leaves the phone.",
    tags: ["Free forever", "Photo + signature", "No signup"],
    accent: "blue",
    cta: "Open the pad →",
  })
}
