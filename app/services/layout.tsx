import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI & Edge-Computing Consultant · Grand Rapids, MI",
  description:
    "AI integration, edge computing, IoT, and data engineering for West Michigan. Based in Forest Hills, serving Grand Rapids and Kent County. Project, hourly, and retainer engagements.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "AI & Edge-Computing Consultant · Grand Rapids, MI",
    description:
      "AI, edge computing, IoT, and data engineering for West Michigan. Based in Forest Hills, serving Grand Rapids and Kent County.",
    url: "https://bradley.io/services",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI & Edge-Computing Consultant · Grand Rapids, MI",
    description:
      "AI, edge computing, IoT, and data engineering for West Michigan. Based in Forest Hills, serving Grand Rapids and Kent County.",
  },
}

const AREA_SERVED = [
  { "@type": "AdministrativeArea", name: "Kent County, Michigan" },
  { "@type": "City", name: "Grand Rapids, Michigan" },
  { "@type": "City", name: "Forest Hills, Michigan" },
  { "@type": "City", name: "Ada, Michigan" },
  { "@type": "City", name: "Cascade, Michigan" },
  { "@type": "City", name: "East Grand Rapids, Michigan" },
  { "@type": "City", name: "Kentwood, Michigan" },
]

// The FAQPage structured data is emitted by page.tsx, from the same array its
// accordion is drawn from, so the two cannot disagree.

export default function V3ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "@id": "https://bradley.io/#service",
            name: "Bradley Isenbek: AI, Edge-Computing & Data-Engineering Consulting",
            url: "https://bradley.io/services",
            image: "https://bradley.io/opengraph-image",
            provider: { "@id": "https://bradley.io/#person" },
            email: "brad@bradley.io",
            priceRange: "$$",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Forest Hills",
              addressRegion: "MI",
              addressCountry: "US",
            },
            geo: { "@type": "GeoCoordinates", latitude: 42.958, longitude: -85.49 },
            areaServed: AREA_SERVED,
            knowsAbout: [
              "Artificial Intelligence",
              "Edge Computing",
              "Internet of Things",
              "Data Engineering",
              "Distributed Systems",
            ],
            serviceType: [
              "AI/ML Integration",
              "Edge Computing & IoT",
              "Data Engineering",
              "Distributed Systems Architecture",
              "API Design & Development",
            ],
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Services", item: "https://bradley.io/services" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
