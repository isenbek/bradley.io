import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The bench · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

// No counts and no status on the card: it is cached for days, and what is up
// on the bench changes by the minute.
export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "The bench",
    title: "Is it up, and where is it.",
    subtitle:
      "Every page this server serves, and whether the hardware behind each instrument is answering right now.",
    tags: ["Instruments", "Dashboards", "Field notes", "Tools"],
    accent: "blue",
    cta: "See what is running →",
  })
}
