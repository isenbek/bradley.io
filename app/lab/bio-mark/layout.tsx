import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The bio mark: vector x-ray · bradley.io",
  description:
    "An interactive decomposition of the bio·bradley.io wordmark: the b/i/o ligature rendered as chords, Bézier offset handles, anchors, the i-tittle plumb line, and the implied ∞. Drag the dot, morph chords↔curves, measure the alignment live.",
  alternates: { canonical: "/lab/bio-mark" },
  openGraph: {
    title: "The bio mark: vector x-ray",
    description:
      "The bio·bradley.io wordmark, decomposed: chords, Bézier offsets, anchors, the i-tittle plumb, and the implied ∞. Interactive.",
    url: "https://bradley.io/lab/bio-mark",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The bio mark: vector x-ray",
    description:
      "The bio·bradley.io wordmark, decomposed: chords, Bézier offsets, anchors, the i-tittle plumb, and the implied ∞. Interactive.",
  },
}

export default function BioMarkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": "https://bradley.io/lab/bio-mark",
            url: "https://bradley.io/lab/bio-mark",
            name: "The bio mark: vector x-ray",
            description:
              "An interactive decomposition of the bio·bradley.io wordmark: chords, Bézier offset handles, anchors, the i-tittle plumb line, and the implied ∞.",
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Lab", item: "https://bradley.io/lab" },
                { "@type": "ListItem", position: 3, name: "The bio mark", item: "https://bradley.io/lab/bio-mark" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
