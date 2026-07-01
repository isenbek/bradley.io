import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Lab — bio·bradley.io",
  description:
    "Frontier experiments — hardware, AI, signals, and creative computing. Things that might not ship but push the boundary.",
  alternates: { canonical: "/lab" },
  openGraph: {
    title: "Lab — bio·bradley.io",
    description:
      "Frontier experiments — hardware, AI, signals, creative computing. Things that might not ship.",
    url: "https://bradley.io/lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lab — bio·bradley.io",
    description:
      "Frontier experiments — hardware, AI, signals, creative computing. Things that might not ship.",
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
            "@id": "https://bradley.io/lab",
            url: "https://bradley.io/lab",
            name: "Lab — bradley.io",
            description:
              "Frontier research and experiments by Bradley Isenbek.",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Lab", item: "https://bradley.io/lab" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
