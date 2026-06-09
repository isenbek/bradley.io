import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Pilot License — bio·bradley.io",
  description:
    "Public flight log of work shipped with Claude as co-pilot — sessions, missions, model usage, token economy, and activity patterns.",
  alternates: { canonical: "/v3/ai-pilot" },
  openGraph: {
    title: "AI Pilot License — bio·bradley.io",
    description:
      "Live flight log — sessions, missions, models, tokens. Built with Claude as co-pilot.",
    url: "https://bradley.io/v3/ai-pilot",
    type: "website",
  },
}

export default function V3AIPilotLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://bradley.io/v3/ai-pilot",
            url: "https://bradley.io/v3/ai-pilot",
            name: "AI Pilot License — bradley.io",
            description:
              "Public dashboard tracking sessions, missions, models, and token economy from work shipped with Claude.",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/v3" },
                { "@type": "ListItem", position: 2, name: "AI Pilot", item: "https://bradley.io/v3/ai-pilot" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
