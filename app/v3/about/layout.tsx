import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About — bio·bradley.io",
  description:
    "Bradley Isenbek — AI Systems Architect and Frontier Technologist in Grand Rapids, MI. 15+ years building at the seam of enterprise scale and maker culture.",
  alternates: { canonical: "/v3/about" },
  openGraph: {
    title: "About — bio·bradley.io",
    description:
      "Bradley Isenbek — hardware hacker, data architect, AI pilot. 15+ years, ESP32 to Fortune-500 warehouses.",
    url: "https://bradley.io/v3/about",
    type: "profile",
  },
}

export default function V3AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "@id": "https://bradley.io/v3/about",
            url: "https://bradley.io/v3/about",
            name: "About Bradley Isenbek",
            mainEntity: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/v3" },
                { "@type": "ListItem", position: 2, name: "About", item: "https://bradley.io/v3/about" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
