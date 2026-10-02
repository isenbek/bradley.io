import type { Metadata } from "next"

const DESCRIPTION =
  "Resume of Bradley S. Isenbek: AI systems architect and machine learning engineer in Grand Rapids, Michigan. Fifteen years of secure, large-scale data systems for government and enterprise."

export const metadata: Metadata = {
  title: "Resume · bio·bradley.io",
  description: DESCRIPTION,
  alternates: { canonical: "/resume" },
  openGraph: {
    title: "Resume · Bradley S. Isenbek",
    description: DESCRIPTION,
    url: "https://bradley.io/resume",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume · Bradley S. Isenbek",
    description: DESCRIPTION,
  },
}

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://bradley.io/resume",
            url: "https://bradley.io/resume",
            name: "Resume of Bradley S. Isenbek",
            about: { "@id": "https://bradley.io/#person" },
            mainEntity: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Resume", item: "https://bradley.io/resume" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
