import type { Metadata } from "next"

const DESCRIPTION =
  "Four GitHub organisations, counted from their commit logs: a year of daily commits, the months since the first, the language mix and the most recently active public repositories for each."

/* The site's own card. A route-level openGraph object replaces the root one
   whole, so without this /work would share with no image at all. */
const IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Bradley Isenbek · bio·bradley.io" }

export const metadata: Metadata = {
  title: "Work",
  description: DESCRIPTION,
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work · Bradley Isenbek",
    description: DESCRIPTION,
    url: "https://bradley.io/work",
    type: "website",
    images: [IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Work · Bradley Isenbek",
    description: DESCRIPTION,
    images: [IMAGE],
  },
}

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/work",
            url: "https://bradley.io/work",
            name: "Work: four GitHub organisations",
            description: DESCRIPTION,
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Work", item: "https://bradley.io/work" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
