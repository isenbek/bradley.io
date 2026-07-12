import type { Metadata } from "next"

const TITLE = "Prime Orchestra: the Riemann explicit formula, live"
const DESC =
  "An interactive instrument that reconstructs the prime-counting staircase from the nontrivial zeros of the Riemann zeta function, one wave at a time. Zero dependencies, runs in the browser."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/projects/prime-orchestra" },
  openGraph: {
    title: "Prime Orchestra: the primes, played by the zeros of zeta",
    description: DESC,
    url: "https://bradley.io/projects/prime-orchestra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Orchestra: the primes, played by the zeros of zeta",
    description: DESC,
  },
}

export default function PrimeOrchestraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/projects/prime-orchestra",
            url: "https://bradley.io/projects/prime-orchestra",
            name: "Prime Orchestra",
            description: DESC,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            about: ["Riemann zeta function", "Prime numbers", "Explicit formula", "Number theory"],
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "Prime Orchestra", item: "https://bradley.io/projects/prime-orchestra" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
