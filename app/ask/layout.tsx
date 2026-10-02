import type { Metadata } from "next"

/**
 * Metadata and structured data for /ask. The page exports none, so the title
 * and description are written once, here.
 *
 * The description says what the page is and what it is not: an AI answering
 * from the resume, with the resume as the record.
 */

const DESCRIPTION =
  "Ask questions about Bradley Isenbek, AI systems architect in Grand Rapids, Michigan. Claude, an AI, answers from his resume and this site and links the evidence. The resume is the record."

const SHORT = "Claude, an AI, answers questions about Bradley's work from his resume and this site, with links to the evidence."

export const metadata: Metadata = {
  title: "Ask about Bradley",
  description: DESCRIPTION,
  alternates: { canonical: "/ask" },
  openGraph: {
    title: "Ask about Bradley Isenbek",
    description: SHORT,
    url: "https://bradley.io/ask",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ask about Bradley Isenbek",
    description: SHORT,
  },
}

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://bradley.io/ask",
            url: "https://bradley.io/ask",
            name: "Ask about Bradley Isenbek",
            description: SHORT,
            about: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Ask", item: "https://bradley.io/ask" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
