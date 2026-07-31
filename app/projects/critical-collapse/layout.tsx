import type { Metadata } from "next"

const TITLE = "Critical Collapse: a black hole solved in your browser"
const DESC =
  "A live 1+1D numerical relativity lab. Einstein's equations coupled to a massless scalar field, integrated on your device in the exact spherical-symmetry system where Choptuik found critical collapse in 1993. Tune a pulse to the knife edge between dispersal and a black hole, bisect for the threshold, and measure the universal mass exponent γ ≈ 0.374 and the echo period Δ ≈ 3.4453 yourself."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/projects/critical-collapse" },
  openGraph: {
    title: "Critical Collapse: a black hole solved in your browser",
    description: DESC,
    url: "https://bradley.io/projects/critical-collapse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Critical Collapse: a black hole solved in your browser",
    description: DESC,
  },
}

export default function CriticalCollapseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/projects/critical-collapse",
            url: "https://bradley.io/projects/critical-collapse",
            name: "Critical Collapse Lab",
            description: DESC,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            about: [
              "General relativity",
              "Numerical relativity",
              "Gravitational collapse",
              "Critical phenomena",
              "Black holes",
              "Choptuik scaling",
            ],
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "Critical Collapse", item: "https://bradley.io/projects/critical-collapse" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
