import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact — bio·bradley.io",
  description:
    "Get in touch with Bradley Isenbek — email, GitHub, project inquiries. Based in Grand Rapids, MI. Replies within ~24 hours.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — bio·bradley.io",
    description:
      "Drop me a line. Email, GitHub, or just a sketch. Based in Grand Rapids, MI.",
    url: "https://bradley.io/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — bio·bradley.io",
    description:
      "Drop me a line. Email, GitHub, or just a sketch. Based in Grand Rapids, MI.",
  },
}

export default function V3ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "@id": "https://bradley.io/contact",
            url: "https://bradley.io/contact",
            name: "Contact — bradley.io",
            mainEntity: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Contact", item: "https://bradley.io/contact" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
