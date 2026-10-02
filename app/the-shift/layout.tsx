import type { Metadata } from "next"

/**
 * Metadata and structured data for /the-shift.
 *
 * No number is quoted here. Half the page's figures come from a record that is
 * regenerated, and a count in a description goes stale in a search result long
 * after the page has moved on. The claim about team size is also left to the
 * page, where it sits beside its caveats.
 *
 * The twitter block is written out because Next does not derive it from
 * openGraph. The share image is ./opengraph-image.tsx.
 */

const TITLE = "The shift"
const DESCRIPTION =
  "How AI rewrites the economics of building software, argued in five sections: domain coverage, cadence, coordination, context and compounding, each with the figure behind it and what the figure cannot show."
const SHORT =
  "How AI rewrites the economics of building software. Five sections of evidence from one project, and a note wherever the evidence runs out."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/the-shift" },
  openGraph: {
    title: `${TITLE} | Bradley Isenbek`,
    description: SHORT,
    url: "https://bradley.io/the-shift",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Bradley Isenbek`,
    description: SHORT,
  },
}

export default function TheShiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": "https://bradley.io/the-shift",
            url: "https://bradley.io/the-shift",
            headline: "The shift: how AI rewrites the economics of building software",
            author: { "@id": "https://bradley.io/#person" },
            publisher: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            mainEntityOfPage: "https://bradley.io/the-shift",
            description: SHORT,
          }),
        }}
      />
      {children}
    </>
  )
}
