import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Airspace Map — bio·bradley.io",
  description:
    "Live ADS-B aircraft on a self-hosted vector map of the Great Lakes — with a 15-minute density forecast, per-aircraft trajectory ribbons, and an RSSI reception bloom. Fed by the Dragonfli 1090 MHz receiver.",
  alternates: { canonical: "/dragonfli/airspace" },
  openGraph: {
    title: "Airspace Map — the sky over Grand Rapids, mapped",
    description:
      "Live aircraft, a 15-minute ML density forecast, trajectory ribbons, and a signal-strength bloom — on a self-hosted vector basemap.",
    url: "https://bradley.io/dragonfli/airspace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Airspace Map — the sky over Grand Rapids, mapped",
    description:
      "Live aircraft, a 15-minute ML density forecast, trajectory ribbons, and a signal-strength bloom — on a self-hosted vector basemap.",
  },
}

export default function V3AirspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/dragonfli/airspace",
            url: "https://bradley.io/dragonfli/airspace",
            name: "Airspace Map — bradley.io",
            description:
              "Live ADS-B aircraft on a self-hosted vector map of the Great Lakes — with a 15-minute density forecast, per-aircraft trajectory ribbons, and an RSSI reception bloom.",
            applicationCategory: "Data Visualization",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Dragonfli", item: "https://bradley.io/dragonfli" },
                { "@type": "ListItem", position: 3, name: "Airspace Map", item: "https://bradley.io/dragonfli/airspace" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
