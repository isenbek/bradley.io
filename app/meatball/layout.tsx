import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Meatball — the sensory machine · bradley.io",
  description:
    "A caseless home server built from salvaged GPUs, an abandoned-office pile of audio dongles, a '60s microphone and early-'90s speakers — taught to see, hear, think, and speak, every model running locally. The project home: a live eye, the bill of materials, and the field notes.",
  alternates: { canonical: "/meatball" },
  openGraph: {
    title: "Meatball — the sensory machine",
    description:
      "A junk-pile home server that learned to see, hear, think, and talk back. Every model on the metal. The live eye, the build, and the field notes — all in one place.",
    url: "https://bradley.io/meatball",
    type: "website",
  },
}

export default function MeatballLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
