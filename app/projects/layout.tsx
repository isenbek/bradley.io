import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects — bio·bradley.io",
  description:
    "86+ projects across hardware, AI, data, systems, and creative research — most shipped with Claude as co-pilot, all self-hosted.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects — bio·bradley.io",
    description: "Hardware, AI, data, systems, research — 86+ projects, mostly open, all self-hosted.",
    url: "https://bradley.io/projects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects — bio·bradley.io",
    description: "Hardware, AI, data, systems, research — 86+ projects, mostly open, all self-hosted.",
  },
}

export default function V3ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/projects",
            url: "https://bradley.io/projects",
            name: "Projects — bradley.io",
            isPartOf: { "@id": "https://bradley.io/#website" },
            about: { "@id": "https://bradley.io/#person" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
