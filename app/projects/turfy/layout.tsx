import type { Metadata } from "next"

const TITLE = "Turfy: a fail-safe AI irrigation sidecar"
const DESC =
  "An AI-driven, weather-informed sidecar controller that retrofits a 1990s Rain Bird ESP-6Si. It only takes authority when its daemon is provably alive. Any failure hands control back to the Rain Bird with zero software involved."

export const metadata: Metadata = {
  title: `${TITLE} · bio·bradley.io`,
  description: DESC,
  alternates: { canonical: "/projects/turfy" },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: "https://bradley.io/projects/turfy",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
}

export default function TurfyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": "https://bradley.io/projects/turfy",
            url: "https://bradley.io/projects/turfy",
            name: "Turfy: a fail-safe AI irrigation sidecar",
            headline: TITLE,
            description: DESC,
            about: ["irrigation", "edge computing", "Raspberry Pi", "hardware watchdog", "automatic transfer switch"],
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "Turfy", item: "https://bradley.io/projects/turfy" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
