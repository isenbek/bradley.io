import type { Metadata } from "next"

/**
 * Wording rule for everything here and on the share card: these are research
 * NOTES from the TerraPulse lab, most of them drafts and none peer reviewed.
 * Do not call them open data either: on 2026-10-02 the pipeline counted 38
 * studies the lab had withdrawn because the data they rest on does not allow
 * commercial use, or because the source was rejected and its data deleted
 * (scripts/papers-pipeline.py, WITHDRAWN AT SOURCE), so "open data" is the
 * one phrase this route cannot use.
 */
const SHARE =
  "Research notes from the TerraPulse lab, each with its figure and its status: seismology, space weather, climate, hydrology and cross-domain work. Mostly drafts, none peer reviewed."

export const metadata: Metadata = {
  title: "Papers · bio·bradley.io",
  description: SHARE,
  alternates: { canonical: "/papers" },
  openGraph: {
    title: "Papers · bio·bradley.io",
    description: SHARE,
    url: "https://bradley.io/papers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Papers · bio·bradley.io",
    description: SHARE,
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
            "@type": "CollectionPage",
            "@id": "https://bradley.io/papers",
            url: "https://bradley.io/papers",
            name: "Papers: research notes from the TerraPulse lab",
            description: SHARE,
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
