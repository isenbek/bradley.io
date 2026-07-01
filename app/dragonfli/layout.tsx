import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dragonfli — bio·bradley.io",
  description:
    "Live ADS-B receiver at 1090 MHz — local radar, active aircraft, FAA registry breakdown, and trajectory predictor.",
  alternates: { canonical: "/dragonfli" },
  openGraph: {
    title: "Dragonfli — bio·bradley.io",
    description:
      "Live 1090 MHz ADS-B receiver — radar, active aircraft, FAA registry, predictor.",
    url: "https://bradley.io/dragonfli",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dragonfli — bio·bradley.io",
    description:
      "Live 1090 MHz ADS-B receiver — radar, active aircraft, FAA registry, predictor.",
  },
}

export default function V3DragonfliLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/dragonfli",
            url: "https://bradley.io/dragonfli",
            name: "Dragonfli — live ADS-B radar",
            description:
              "Live ADS-B receiver at 1090 MHz — local radar, active aircraft, FAA registry breakdown, and trajectory predictor.",
            applicationCategory: "Data Visualization",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Dragonfli", item: "https://bradley.io/dragonfli" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
