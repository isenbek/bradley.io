import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Papers — bio·bradley.io",
  description:
    "TerraPulse research — seismology, space weather, climate, hydrology, and cross-domain statistical analysis on open government data.",
  alternates: { canonical: "/papers" },
  openGraph: {
    title: "Papers — bio·bradley.io",
    description:
      "Active research notes and papers — seismology, space weather, climate, cross-domain analysis.",
    url: "https://bradley.io/papers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Papers — bio·bradley.io",
    description:
      "Active research notes and papers — seismology, space weather, climate, cross-domain analysis.",
  },
}

export default function V3PapersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/papers",
            url: "https://bradley.io/papers",
            name: "Papers — TerraPulse research",
            description:
              "Research notes and papers across seismology, space weather, climate, and cross-domain analysis.",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Papers", item: "https://bradley.io/papers" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
