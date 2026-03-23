import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Research Papers",
  description:
    "TerraPulse research — 13 active studies in seismology, space weather, climate, and cross-domain environmental analysis. Powered by open government data.",
  alternates: { canonical: "/papers" },
  openGraph: {
    title: "Research Papers | bradley.io",
    description:
      "TerraPulse research — active studies in seismology, space weather, climate, and environmental data analysis.",
    url: "https://bradley.io/papers",
  },
}

export default function PapersLayout({ children }: { children: React.ReactNode }) {
  return children
}
