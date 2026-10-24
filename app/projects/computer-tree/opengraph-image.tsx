import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "The Computer Tree: the US Army's 1961 family tree of the computer, grown to 2025, 542 machines from ENIAC to Fugaku. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "the computer tree · 1945 to 2025",
    title: "Every computer has a family tree.",
    sentence:
      "The Army's 1961 chart, transcribed and grown a ring per decade: 542 machines, ENIAC to Fugaku. Pick one and trace it home.",
  })
}
