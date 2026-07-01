import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "WorldEvent bus — bio·bradley.io",
  description:
    "The perception bus: a live, schema-tagged firehose of everything the sensors notice — every event type, host, and rate on one wire. A new sense, not a single feed.",
  alternates: { canonical: "/dragonfli/worldevent" },
  openGraph: {
    title: "WorldEvent — every sense, one firehose",
    description:
      "A live, type-agnostic view of the worldevent/1 perception bus — event types, hosts, throughput, and a rolling tail of everything happening in the world.",
    url: "https://bradley.io/dragonfli/worldevent",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorldEvent — every sense, one firehose",
    description:
      "A live, type-agnostic view of the worldevent/1 perception bus — event types, hosts, throughput, and a rolling tail of everything happening in the world.",
  },
}

export default function WorldEventLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/dragonfli/worldevent",
            url: "https://bradley.io/dragonfli/worldevent",
            name: "WorldEvent bus — bradley.io",
            description:
              "A live, schema-tagged firehose of everything the sensors notice — every event type, host, and rate on one wire.",
            applicationCategory: "Data Visualization",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Dragonfli", item: "https://bradley.io/dragonfli" },
                { "@type": "ListItem", position: 3, name: "WorldEvent", item: "https://bradley.io/dragonfli/worldevent" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
