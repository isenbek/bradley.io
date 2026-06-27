import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The bio mark — vector x-ray · bradley.io",
  description:
    "An interactive decomposition of the bio·bradley.io wordmark: the b/i/o ligature rendered as chords, Bézier offset handles, anchors, the i-tittle plumb line, and the implied ∞. Drag the dot, morph chords↔curves, measure the alignment live.",
  alternates: { canonical: "/lab/bio-mark" },
  openGraph: {
    title: "The bio mark — vector x-ray",
    description:
      "The bio·bradley.io wordmark, decomposed: chords, Bézier offsets, anchors, the i-tittle plumb, and the implied ∞ — interactive.",
    url: "https://bradley.io/lab/bio-mark",
    type: "website",
  },
}

export default function BioMarkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
