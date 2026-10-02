import type { Metadata } from "next"

/**
 * /bench: metadata, share card text and JSON-LD.
 *
 * The description makes no claim about what is up: a share card is cached for
 * days and the instruments are not. It says what the page does.
 */

const DESCRIPTION =
  "Every page this server serves, in one list, and for the instruments whether the hardware behind them is answering right now: live, stale or offline, with when each was last heard."

export const metadata: Metadata = {
  title: "The bench",
  description: DESCRIPTION,
  alternates: { canonical: "/bench" },
  openGraph: {
    title: "The bench · bradley.io",
    description: DESCRIPTION,
    url: "https://bradley.io/bench",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The bench · bradley.io",
    description: DESCRIPTION,
  },
}

export default function BenchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/bench",
            url: "https://bradley.io/bench",
            name: "The bench · bradley.io",
            description: DESCRIPTION,
            isPartOf: { "@id": "https://bradley.io/#website" },
            about: { "@id": "https://bradley.io/#person" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "The bench", item: "https://bradley.io/bench" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
