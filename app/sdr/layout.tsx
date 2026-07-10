import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SDR · bio·bradley.io",
  description:
    "Live status for the SDR scanner stack: band registry, soak archive, top frequencies, and job history from rtl-sdr.",
  alternates: { canonical: "/sdr" },
  openGraph: {
    title: "SDR · bio·bradley.io",
    description:
      "Live SDR scanner status: bands, soaks, top frequencies, jobs. Built on rtl-sdr.",
    url: "https://bradley.io/sdr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SDR · bio·bradley.io",
    description:
      "Live SDR scanner status: bands, soaks, top frequencies, jobs. Built on rtl-sdr.",
  },
}

export default function V3SdrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/sdr",
            url: "https://bradley.io/sdr",
            name: "SDR · bradley.io",
            description:
              "Live status for the SDR scanner stack: band registry, soak archive, top frequencies, and job history from rtl-sdr.",
            applicationCategory: "Data Visualization",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "SDR", item: "https://bradley.io/sdr" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
