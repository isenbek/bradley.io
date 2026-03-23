import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Research Papers",
  description:
    "TerraPulse research — 13 active studies in seismology, space weather, climate, and cross-domain environmental analysis. Powered by open government data and reproducible methods.",
  alternates: { canonical: "/papers" },
  keywords: [
    "environmental data science",
    "temporal clustering",
    "earthquake statistics",
    "space weather analysis",
    "climate data",
    "ENSO",
    "seismology",
    "arXiv",
    "TerraPulse",
    "open data research",
  ],
  openGraph: {
    title: "Research Papers | bradley.io",
    description:
      "TerraPulse research — 13 active studies in seismology, space weather, climate, and cross-domain environmental data analysis.",
    url: "https://bradley.io/papers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Research Papers | bradley.io",
    description:
      "TerraPulse environmental data science research — seismology, space weather, climate analysis.",
  },
}

export default function PapersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                "@id": "https://bradley.io/papers",
                name: "TerraPulse Research Papers",
                description:
                  "Active research in environmental data science — seismology, space weather, climate patterns, and cross-domain statistical analysis.",
                url: "https://bradley.io/papers",
                isPartOf: { "@id": "https://bradley.io/#website" },
                about: [
                  { "@type": "Thing", name: "Environmental Data Science" },
                  { "@type": "Thing", name: "Seismology" },
                  { "@type": "Thing", name: "Space Weather" },
                  { "@type": "Thing", name: "Climate Analysis" },
                ],
              },
              {
                "@type": "ScholarlyArticle",
                headline:
                  "Temporal Clustering is Universal in Environmental Data: A Cross-Domain Inter-Event Time Analysis",
                author: {
                  "@type": "Organization",
                  name: "TerraPulse Lab",
                },
                datePublished: "2026-03-22",
                description:
                  "We tested 12 environmental event streams across 6 domains. Every single one is temporally clustered (CV > 1.0). No domain follows a homogeneous Poisson process.",
                url: "https://bradley.io/data/papers/cross-domain-clustering-paper.pdf",
                publisher: { "@id": "https://bradley.io/#person" },
                about: [
                  { "@type": "Thing", name: "Temporal Clustering" },
                  { "@type": "Thing", name: "Inter-Event Time Analysis" },
                  { "@type": "Thing", name: "Poisson Process" },
                  { "@type": "Thing", name: "Environmental Hazards" },
                ],
                keywords:
                  "temporal clustering, coefficient of variation, inter-event time, earthquake statistics, space weather, environmental data",
              },
            ],
          }),
        }}
      />
      {children}
    </>
  )
}
