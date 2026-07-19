import type { Metadata } from "next"

const TITLE = "Zeta Forge: build the zeta function one term at a time"
const DESC =
  "An interactive series-intuition builder for ζ(s) = Σ n⁻ˢ. Every term is an arrow; laid head to tail they walk the complex plane, and where the walk lands is the value. Watch convergence, the pole, analytic continuation, and the zeros happen rather than be asserted."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/projects/zeta-forge" },
  openGraph: {
    title: "Zeta Forge: build zeta one arrow at a time",
    description: DESC,
    url: "https://bradley.io/projects/zeta-forge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zeta Forge: build zeta one arrow at a time",
    description: DESC,
  },
}

export default function ZetaForgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/projects/zeta-forge",
            url: "https://bradley.io/projects/zeta-forge",
            name: "Zeta Forge",
            description: DESC,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            about: [
              "Riemann zeta function",
              "Analytic continuation",
              "Complex analysis",
              "Dirichlet series",
              "Number theory",
            ],
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "Zeta Forge", item: "https://bradley.io/projects/zeta-forge" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
