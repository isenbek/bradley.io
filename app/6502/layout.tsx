import type { Metadata } from "next"

const DESC =
  "A transistor-level 6502 you can run in a browser, rebuilt on the visual6502 die trace, plus an archived, link-checked collection of every 6502 resource worth keeping: the original simulators, the 1976 MOS manuals, the undocumented opcodes, and the machines it powered."

export const metadata: Metadata = {
  title: "The 6502, switch by switch · bradley.io",
  description: DESC,
  keywords: [
    "6502",
    "MOS 6502",
    "visual6502",
    "transistor-level simulation",
    "die shot",
    "silicon archaeology",
    "retrocomputing",
    "6502 opcodes",
  ],
  alternates: { canonical: "/6502" },
  openGraph: {
    title: "The 6502, switch by switch",
    description: DESC,
    url: "https://bradley.io/6502",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The 6502, switch by switch",
    description:
      "A 1975 processor simulated from a photograph of its own die, plus a link-checked archive of everything 6502: the original visual6502 material, the MOS manuals, the undocumented opcodes, and the machines it ran.",
  },
}

export default function MosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/6502",
            url: "https://bradley.io/6502",
            name: "The 6502, switch by switch",
            description: DESC,
            about: {
              "@type": "Product",
              name: "MOS Technology 6502",
              sameAs: "https://en.wikipedia.org/wiki/MOS_6502",
            },
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "The 6502", item: "https://bradley.io/6502" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
