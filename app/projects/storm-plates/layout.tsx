import type { Metadata } from "next"

const TITLE = "Storm Plates: the prime sieve drawn as weather"
const DESC =
  "Six interactive plates that present the sieve of Eratosthenes as wave interference. One swell per prime rolls under a plank bridge, every crest breaks the plank it lands on, and the survivors are the primes. Record gaps, twin primes, the p² surfacing frontier and the zeta zeros all fall out of the same picture."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/projects/storm-plates" },
  openGraph: {
    title: "Storm Plates: the prime sieve drawn as weather",
    description: DESC,
    url: "https://bradley.io/projects/storm-plates",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Storm Plates: the prime sieve drawn as weather",
    description: DESC,
  },
}

export default function StormPlatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/projects/storm-plates",
            url: "https://bradley.io/projects/storm-plates",
            name: "Storm Plates",
            description: DESC,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            about: [
              "Sieve of Eratosthenes",
              "Prime gaps",
              "Twin prime conjecture",
              "Explicit formula",
              "Number theory",
            ],
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "Storm Plates", item: "https://bradley.io/projects/storm-plates" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
