import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The truck quote pad, free · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "House Calls · free tools",
    title: "Quote it from the truck.",
    subtitle:
      "Line items in, a professional quote out: print it or text it. No account, no signup, nothing leaves your phone.",
    tags: ["Free forever", "Works offline", "No signup"],
    accent: "blue",
    cta: "Open the pad →",
  })
}
