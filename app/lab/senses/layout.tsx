import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "I gave a junk-pile eyes, ears, and a voice — bio·bradley.io",
  description:
    "A caseless home server built from salvaged GPUs, an abandoned-office pile of USB audio dongles, '60s and thrift-store mics, and early-'90s Altec Lansings — taught to see, hear, think, and speak, every model running locally. Anti-cloud, host local.",
  alternates: { canonical: "/lab/senses" },
  openGraph: {
    title: "I gave a junk-pile eyes, ears, and a voice",
    description:
      "How a frankenstein home server — no case, salvaged everything — learned to see, hear, think, and talk back, with every model on the metal.",
    url: "https://bradley.io/lab/senses",
    type: "article",
  },
}

export default function SensesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
