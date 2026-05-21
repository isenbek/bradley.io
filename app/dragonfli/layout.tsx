import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "dragonfli · bradley.io",
  description:
    "Live ADS-B aircraft tracker — Raspberry Pi receiver, FAA registry enrichment, and an ML density predictor.",
}

export default function DragonfliLayout({ children }: { children: React.ReactNode }) {
  return children
}
