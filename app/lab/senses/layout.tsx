import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "I gave a junk-pile eyes, ears, and a voice — bio·bradley.io",
  description:
    "A caseless home server built from salvaged GPUs, an abandoned-office pile of USB audio dongles, '60s and thrift-store mics, and early-'90s Altec Lansings — taught to see, hear, think, and speak, every model running locally. Anti-cloud, host local.",
  alternates: { canonical: "/lab/senses" },
  openGraph: {
    title: "I gave a junk-pile eyes, ears, and a voice",
    description:
      "How a frankenstein home server — no case, salvaged everything — learned to see, hear, think, and talk back, with every model on the metal.",
    url: "https://bradley.io/lab/senses",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "I gave a junk-pile eyes, ears, and a voice",
    description:
      "How a frankenstein home server — no case, salvaged everything — learned to see, hear, think, and talk back, with every model on the metal.",
  },
}

export default function SensesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "@id": "https://bradley.io/lab/senses",
            url: "https://bradley.io/lab/senses",
            headline: "I gave a junk-pile eyes, ears, and a voice",
            description:
              "A caseless home server built from salvaged parts — taught to see, hear, think, and speak, every model running locally. Anti-cloud, host local.",
            author: { "@id": "https://bradley.io/#person" },
            publisher: { "@id": "https://bradley.io/#person" },
            mainEntityOfPage: "https://bradley.io/lab/senses",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Lab", item: "https://bradley.io/lab" },
                { "@type": "ListItem", position: 3, name: "Senses", item: "https://bradley.io/lab/senses" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
