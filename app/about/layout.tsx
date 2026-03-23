import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Bradley Isenbek",
  description:
    "AI Systems Architect and Frontier Technologist based in Grand Rapids, MI. 15+ years building systems at scale — from ESP32 mesh networks to Fortune 500 data warehouses.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Bradley Isenbek | bradley.io",
    description:
      "AI Systems Architect. 15+ years building at the intersection of enterprise scale and maker culture.",
    url: "https://bradley.io/about",
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
