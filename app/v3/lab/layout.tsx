import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Lab — bio·bradley.io",
  description:
    "Frontier experiments — hardware, AI, signals, and creative computing. Things that might not ship but push the boundary.",
  alternates: { canonical: "/v3/lab" },
  openGraph: {
    title: "Lab — bio·bradley.io",
    description:
      "Frontier experiments — hardware, AI, signals, creative computing. Things that might not ship.",
    url: "https://bradley.io/v3/lab",
    type: "website",
  },
}

export default function V3LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/v3/lab",
            url: "https://bradley.io/v3/lab",
            name: "Lab — bradley.io",
            description:
              "Frontier research and experiments by Bradley Isenbek.",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/v3" },
                { "@type": "ListItem", position: 2, name: "Lab", item: "https://bradley.io/v3/lab" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
