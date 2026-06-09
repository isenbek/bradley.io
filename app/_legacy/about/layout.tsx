import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bradley Isenbek — About",
  description:
    "Bradley Isenbek (Brad Isenbek, Bradley S. Isenbek) — AI Systems Architect and Frontier Technologist based in Grand Rapids, MI. 15+ years building systems at scale, from ESP32 mesh networks to Fortune 500 data warehouses.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Bradley Isenbek — About",
    description:
      "Bradley Isenbek — AI Systems Architect. 15+ years building at the intersection of enterprise scale and maker culture.",
    url: "https://bradley.io/about",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bradley Isenbek — About",
    description:
      "AI Systems Architect and Frontier Technologist based in Grand Rapids, MI.",
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "@id": "https://bradley.io/about",
            url: "https://bradley.io/about",
            name: "About Bradley Isenbek",
            mainEntity: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            about: { "@id": "https://bradley.io/#person" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://bradley.io",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "About",
                  item: "https://bradley.io/about",
                },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
