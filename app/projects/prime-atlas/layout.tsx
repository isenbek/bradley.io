import type { Metadata } from "next"

const TITLE = "Primality Atlas: a terrain map of prime-number theory"
const DESC =
  "An interactive terrain map of the territory around the primes: twenty-nine landmarks across proven ground, conjectured pasture, dark rooms, and the barriers proven impassable. From the Euler spring to the parity cliff, pan, zoom and tap anything."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/projects/prime-atlas" },
  openGraph: {
    title: "Primality Atlas: a terrain map of the territory around the primes",
    description: DESC,
    url: "https://bradley.io/projects/prime-atlas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Primality Atlas: a terrain map of the territory around the primes",
    description: DESC,
  },
}

export default function PrimeAtlasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/projects/prime-atlas",
            url: "https://bradley.io/projects/prime-atlas",
            name: "Primality Atlas",
            description: DESC,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            about: [
              "Riemann hypothesis",
              "Prime numbers",
              "Analytic number theory",
              "Parity problem",
              "Bounded gaps between primes",
            ],
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "Primality Atlas", item: "https://bradley.io/projects/prime-atlas" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
