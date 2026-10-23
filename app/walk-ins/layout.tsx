import type { Metadata } from "next"

const DESCRIPTION =
  "A one-page resume, a five-mile circle around home in Kentwood, Michigan, and every door, logged in the open: the full-time search as it happens, with the whole Claude Code record beside it."

const IMAGE = { url: "/walk-ins/opengraph-image", width: 1200, height: 630, alt: "Walk-ins · bradley.io" }

export const metadata: Metadata = {
  title: "Walk-ins",
  description: DESCRIPTION,
  alternates: { canonical: "/walk-ins" },
  openGraph: {
    title: "Walk-ins | Bradley Isenbek",
    description: DESCRIPTION,
    url: "https://bradley.io/walk-ins",
    type: "website",
    images: [IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Walk-ins | Bradley Isenbek",
    description: DESCRIPTION,
    images: [IMAGE],
  },
}

export default function WalkInsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://bradley.io/walk-ins",
            url: "https://bradley.io/walk-ins",
            name: "Walk-ins: the full-time search, in the open",
            description: DESCRIPTION,
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Walk-ins", item: "https://bradley.io/walk-ins" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
