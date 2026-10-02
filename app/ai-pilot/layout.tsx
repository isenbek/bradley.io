import type { Metadata } from "next"

/**
 * Metadata and structured data for /ai-pilot. The page is a server component
 * that reads the record on every request; nothing here depends on the data, so
 * no number is quoted in a description that would go stale in a search result.
 *
 * The twitter block is written out because Next does not derive it from
 * openGraph. The share image is ./opengraph-image.tsx.
 */

const TITLE = "AI pilot licence"
const DESCRIPTION =
  "Every flight, on the record: the work I ship with Claude as co-pilot, counted from the session logs. The licence, the days, the models flown, the mission log, the tools and the token economy."
const SHORT =
  "The licence, the days, the models flown, the mission log and the token economy, computed from the session logs rather than claimed."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ai-pilot" },
  openGraph: {
    title: `${TITLE} | Bradley Isenbek`,
    description: SHORT,
    url: "https://bradley.io/ai-pilot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Bradley Isenbek`,
    description: SHORT,
  },
}

export default function AiPilotLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://bradley.io/ai-pilot",
            url: "https://bradley.io/ai-pilot",
            name: `${TITLE} | bradley.io`,
            description: SHORT,
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "AI pilot",
                  item: "https://bradley.io/ai-pilot",
                },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
