import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fleet Health · bio·bradley.io",
  description:
    "Live health for the collector fleet behind the WorldEvent bus: per-node vitals, an attention layer, and a self-healing auto-medic.",
  alternates: { canonical: "/fleet" },
  openGraph: {
    title: "Fleet Health · bio·bradley.io",
    description:
      "Live collector-fleet health: per-node vitals, attention gating, and a self-healing medic. Powered by worldsink.",
    url: "https://bradley.io/fleet",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fleet Health · bio·bradley.io",
    description:
      "Live collector-fleet health: per-node vitals, attention gating, and a self-healing medic. Powered by worldsink.",
  },
}

export default function V3FleetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/fleet",
            url: "https://bradley.io/fleet",
            name: "Fleet Health · bradley.io",
            description:
              "Live health for the collector fleet behind the WorldEvent bus: per-node vitals, attention gating, and a self-healing auto-medic.",
            applicationCategory: "Data Visualization",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Fleet Health", item: "https://bradley.io/fleet" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
