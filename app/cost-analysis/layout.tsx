import type { Metadata } from "next"

/**
 * Metadata and structured data for /cost-analysis.
 *
 * The page is a frozen case study of one fixed window, so the window is safe
 * to quote here: it cannot go stale. What is deliberately NOT quoted is any of
 * the ratios (the percentage, the "9 months to 34 days" compression, the
 * velocity multiplier): a search result or a share card has no room for the
 * caveat that one side of each is a model, and the page itself declines to
 * headline two of them.
 *
 * The twitter block is written out because Next does not derive it from
 * openGraph. The share image is ./opengraph-image.tsx.
 */

const TITLE = "Cost analysis"
const DESCRIPTION =
  "What one operator with AI tooling cost against a modelled conventional team: a frozen case study of one real project, 2025-12-01 to 2026-03-26, with the cumulative cost curve and the weekly counts behind it."
const SHORT =
  "A frozen case study of one project, 2025-12-01 to 2026-03-26: recorded cost at flat rates against a modelled team that was never hired. The curve, the weekly counts and the caveats."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cost-analysis" },
  openGraph: {
    title: `${TITLE} | Bradley Isenbek`,
    description: SHORT,
    url: "https://bradley.io/cost-analysis",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Bradley Isenbek`,
    description: SHORT,
  },
}

export default function CostAnalysisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": "https://bradley.io/cost-analysis",
            url: "https://bradley.io/cost-analysis",
            headline: "Cost analysis: one operator with AI tooling against a modelled team",
            author: { "@id": "https://bradley.io/#person" },
            publisher: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            mainEntityOfPage: "https://bradley.io/cost-analysis",
            description: SHORT,
          }),
        }}
      />
      {children}
    </>
  )
}
