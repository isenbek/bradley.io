import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Meatball: the sensory machine · bradley.io",
  description:
    "A caseless home server built from salvaged GPUs, an abandoned-office pile of audio dongles, a '60s microphone and early-'90s speakers, taught to see, hear, think, and speak, every model running locally. The project home: a live eye, the bill of materials, and the field notes.",
  alternates: { canonical: "/meatball" },
  openGraph: {
    title: "Meatball: the sensory machine",
    description:
      "A junk-pile home server that learned to see, hear, think, and talk back. Every model on the metal. The live eye, the build, and the field notes, all in one place.",
    url: "https://bradley.io/meatball",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meatball: the sensory machine",
    description:
      "A junk-pile home server that learned to see, hear, think, and talk back. Every model on the metal. The live eye, the build, and the field notes, all in one place.",
  },
}

export default function MeatballLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": "https://bradley.io/meatball",
            url: "https://bradley.io/meatball",
            name: "Meatball: sensory AI robot",
            description:
              "A caseless home server built from salvaged parts, taught to see, hear, think, and speak, every model running locally. The project home: a live eye, the bill of materials, and the field notes.",
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Meatball", item: "https://bradley.io/meatball" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
