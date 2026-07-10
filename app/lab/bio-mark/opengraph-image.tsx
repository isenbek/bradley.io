import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "The bio mark: vector x-ray · bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Lab · vector x-ray",
    title: "The Bio Mark",
    subtitle:
      "The bio·bradley.io wordmark, decomposed: chords, Bézier offsets, anchors, the i-tittle plumb, and the implied ∞, interactive.",
    tags: ["Vectors", "Bézier", "Typography", "Interactive"],
    accent: "gold",
    cta: "Drag the dot →",
  })
}
