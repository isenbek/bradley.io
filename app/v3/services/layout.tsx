import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services — bio·bradley.io",
  description:
    "AI & data engineering consulting. Distributed systems, data pipelines, APIs, edge/IoT, and AI/ML integration. Project, hourly, and retainer engagements.",
  alternates: { canonical: "/v3/services" },
  openGraph: {
    title: "Services — bio·bradley.io",
    description:
      "Distributed systems, data pipelines, edge/IoT, AI/ML integration. 15+ years building production systems at scale.",
    url: "https://bradley.io/v3/services",
    type: "website",
  },
}

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
            name: "Bradley Isenbek — AI & Data Engineering Consulting",
            url: "https://bradley.io/v3/services",
            provider: { "@id": "https://bradley.io/#person" },
            areaServed: "US",
            serviceType: [
              "Distributed Systems Architecture",
              "Data Engineering",
              "API Design & Development",
              "Edge Computing & IoT",
              "AI/ML Integration",
            ],
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/v3" },
                { "@type": "ListItem", position: 2, name: "Services", item: "https://bradley.io/v3/services" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
