import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "The Computer Tree: the US Army's 1961 family tree of the computer, grown to 2025, 542 machines from ENIAC to Fugaku. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "the computer tree · 1945 to 2025",
    title: "Every computer has a family tree.",
    subtitle:
      "The Army's 1961 chart, transcribed and grown a ring per decade: 542 machines, ENIAC to Fugaku. Pick one and trace it home.",
    tags: ["542 machines", "614 links", "1961 chart", "open data"],
    accent: "blue",
    cta: "Trace a machine →",
  })
}
