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

const FAQ = [
  {
    q: "Do you provide AI and data-engineering consulting in Grand Rapids?",
    a: "Yes. I'm based in Forest Hills, Michigan and work with teams across Grand Rapids and Kent County, on-site or remote, on AI integration, data pipelines, and production systems at scale.",
  },
  {
    q: "What is edge computing, and can you build it for a West Michigan business?",
    a: "Edge computing runs data processing on local hardware instead of a distant cloud, cutting latency and cloud bills. I design and build edge and IoT systems for businesses in Grand Rapids, Ada, Cascade, and the wider Kent County area.",
  },
  {
    q: "Do you work on-site in the Grand Rapids area?",
    a: "Yes. As a Forest Hills-based technologist I can work on-site across Kent County when it helps, and remotely for everything else.",
  },
]

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://bradley.io/services#faq",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      {children}
    </>
  )
}
