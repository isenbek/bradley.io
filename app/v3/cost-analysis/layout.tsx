import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cost Analysis — bio·bradley.io",
  description:
    "What does it actually cost to ship enterprise software with AI? Real numbers from 117 days of Campaign Brain development — one person, $61K, 95% reduction vs legacy.",
  alternates: { canonical: "/v3/cost-analysis" },
  openGraph: {
    title: "Cost Analysis — bio·bradley.io",
    description:
      "$61K, 117 days, one person, with Claude. Vs a $1.3M, 9-month, 9.5-person team.",
    url: "https://bradley.io/v3/cost-analysis",
    type: "article",
  },
}

export default function V3CostAnalysisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": "https://bradley.io/v3/cost-analysis",
            url: "https://bradley.io/v3/cost-analysis",
            headline: "Cost Analysis — building Campaign Brain with Claude",
            author: { "@id": "https://bradley.io/#person" },
            publisher: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            mainEntityOfPage: "https://bradley.io/v3/cost-analysis",
            description:
              "A bottom-up cost comparison: 9.5-person team vs one operator + Claude.",
          }),
        }}
      />
      {children}
    </>
  )
}
