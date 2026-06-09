import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Consulting Services",
  description:
    "Data engineering, distributed systems, AI/ML integration, and edge computing consulting. Project-based ($25K–$100K), hourly ($150–$275/hr), or retainer engagements.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Consulting Services | bradley.io",
    description:
      "Data engineering, distributed systems, AI/ML integration, and edge computing consulting.",
    url: "https://bradley.io/services",
  },
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
