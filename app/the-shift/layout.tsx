import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The Shift — bio·bradley.io",
  description:
    "How AI rewrites the economics of building software. Five sections of evidence from a year of shipping with Claude as co-pilot.",
  alternates: { canonical: "/the-shift" },
  openGraph: {
    title: "The Shift — bio·bradley.io",
    description:
      "How AI rewrites the economics of building software — one person covering ground that used to need a team.",
    url: "https://bradley.io/the-shift",
    type: "article",
  },
}

export default function V3TheShiftLayout({ children }: { children: React.ReactNode }) {
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
            headline: "The Shift — how AI rewrites the economics of building software",
            author: { "@id": "https://bradley.io/#person" },
            publisher: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            mainEntityOfPage: "https://bradley.io/the-shift",
          }),
        }}
      />
      {children}
    </>
  )
}
