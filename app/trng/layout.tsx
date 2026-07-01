import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TRNG — bio·bradley.io",
  description:
    "Live status for the HOTBITS true random number generator — radioactive decay timing from a CAJOE Geiger counter, with NIST-style continuous health checks.",
  alternates: { canonical: "/trng" },
  openGraph: {
    title: "TRNG — bio·bradley.io",
    description:
      "Live entropy from radioactive decay — bias, ones %, pileup, NIST continuous health.",
    url: "https://bradley.io/trng",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TRNG — bio·bradley.io",
    description:
      "Live entropy from radioactive decay — bias, ones %, pileup, NIST continuous health.",
  },
}

export default function V3TrngLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/trng",
            url: "https://bradley.io/trng",
            name: "HOTBITS TRNG",
            description:
              "Live status for the HOTBITS true random number generator — radioactive decay timing from a CAJOE Geiger counter, with NIST-style continuous health checks.",
            applicationCategory: "Data Visualization",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "TRNG", item: "https://bradley.io/trng" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
