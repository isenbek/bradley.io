import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Meatball's memory: moments lined up · bradley.io",
  description:
    "A multimodal timeline: Meatball's motion and speech events folded onto one line, each keeping the scene before and after, with cross-modal events nearby. The substrate for relating image patches to speech over time.",
  alternates: { canonical: "/meatball/memory" },
  robots: { index: false },
  openGraph: {
    title: "Meatball's memory: moments lined up",
    description: "Motion + speech events on one timeline, each with the scene before & after.",
    url: "https://bradley.io/meatball/memory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meatball's memory: moments lined up",
    description: "Motion + speech events on one timeline, each with the scene before & after.",
  },
}

export default function MemoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
