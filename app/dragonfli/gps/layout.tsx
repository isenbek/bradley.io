import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "GPS — bio·bradley.io",
  description:
    "Live GNSS from the Dragonfli receiver — a satellite skyplot by SNR, the signal spectrum, the fix-precision cloud, and the ground track on a self-hosted vector basemap.",
  alternates: { canonical: "/dragonfli/gps" },
  openGraph: {
    title: "GPS — the sky, from the ground up",
    description:
      "Live satellite skyplot, SNR spectrum, fix-precision cloud, and ground track — off the same receiver that feeds the airspace map.",
    url: "https://bradley.io/dragonfli/gps",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GPS — the sky, from the ground up",
    description:
      "Live satellite skyplot, SNR spectrum, fix-precision cloud, and ground track — off the same receiver that feeds the airspace map.",
  },
}

export default function GpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/dragonfli/gps",
            url: "https://bradley.io/dragonfli/gps",
            name: "GPS — bradley.io",
            description:
              "Live GNSS from the Dragonfli receiver — a satellite skyplot by SNR, the signal spectrum, the fix-precision cloud, and the ground track on a self-hosted vector basemap.",
            applicationCategory: "Data Visualization",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Dragonfli", item: "https://bradley.io/dragonfli" },
                { "@type": "ListItem", position: 3, name: "GPS", item: "https://bradley.io/dragonfli/gps" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
