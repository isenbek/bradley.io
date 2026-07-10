import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Entropy Space · bio·bradley.io",
  description:
    "Live 3D visualizations of true randomness from radioactive decay: a rotatable entropy cube, return map, scrolling bit-raster, and a 24h quality phase-space, all fed by the HOTBITS TRNG.",
  alternates: { canonical: "/trng/space" },
  openGraph: {
    title: "Entropy Space: what does randomness look like?",
    description:
      "Rotatable 3D point clouds of live radioactive-decay entropy: true noise fills space; a broken PRNG can't hide its planes.",
    url: "https://bradley.io/trng/space",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Entropy Space: what does randomness look like?",
    description:
      "Rotatable 3D point clouds of live radioactive-decay entropy: true noise fills space; a broken PRNG can't hide its planes.",
  },
}

export default function V3EntropySpaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": "https://bradley.io/trng/space",
            url: "https://bradley.io/trng/space",
            name: "Entropy Space · bradley.io",
            description:
              "Live 3D visualizations of true randomness from radioactive decay: a rotatable entropy cube, return map, scrolling bit-raster, and a 24h quality phase-space, all fed by the HOTBITS TRNG.",
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "TRNG", item: "https://bradley.io/trng" },
                { "@type": "ListItem", position: 3, name: "Entropy Space", item: "https://bradley.io/trng/space" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
