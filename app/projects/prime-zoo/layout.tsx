import type { Metadata } from "next"

const TITLE = "Primality Zoo: three field instruments for prime structure"
const DESC =
  "An interactive zoo of prime structure: test whether a prime constellation can exist at all, watch the Chebyshev race between residue classes, and read the gap transition matrix that shows consecutive primes avoiding their own residue. Sieves to two million in the browser."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/projects/prime-zoo" },
  openGraph: {
    title: "Primality Zoo: the structure hiding in the primes",
    description: DESC,
    url: "https://bradley.io/projects/prime-zoo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Primality Zoo: the structure hiding in the primes",
    description: DESC,
  },
}

export default function PrimeZooLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/projects/prime-zoo",
            url: "https://bradley.io/projects/prime-zoo",
            name: "Primality Zoo",
            description: DESC,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            about: [
              "Prime numbers",
              "Prime constellations",
              "Hardy-Littlewood conjecture",
              "Chebyshev bias",
              "Number theory",
            ],
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            isRelatedTo: { "@id": "https://bradley.io/projects/prime-orchestra" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "Primality Zoo", item: "https://bradley.io/projects/prime-zoo" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
