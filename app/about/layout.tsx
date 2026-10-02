import type { Metadata } from "next"

/**
 * Metadata and structured data for /about. The page itself exports none, so
 * there is one place where the title and the description are written.
 *
 * Every phrase here is on the page or in lib/resume.ts: the role (the resume's
 * headline), Grand Rapids, 1997 (the first role), "garage lab" and hosting
 * locally (the Philosophy section, his words).
 */

const DESCRIPTION =
  "Bradley Isenbek, AI systems architect in Grand Rapids, Michigan. The story in his own words, every role since 1997 on one axis, what he is building this year, and how this site is built."

const SHORT =
  "AI systems architect in Grand Rapids, Michigan. Production systems since 1997, and a garage lab where everything is hosted locally."

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Bradley Isenbek",
    description: SHORT,
    url: "https://bradley.io/about",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Bradley Isenbek",
    description: SHORT,
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "@id": "https://bradley.io/about",
            url: "https://bradley.io/about",
            name: "About Bradley Isenbek",
            mainEntity: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "About", item: "https://bradley.io/about" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
