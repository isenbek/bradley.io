import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The Shift",
  description:
    "How AI rewrites the economics of building software — one person covering 8 engineering domains, 135K messages, 0 meetings. A data-driven thesis on the new model of software development.",
  alternates: { canonical: "/the-shift" },
  keywords: [
    "AI software development",
    "Claude Code",
    "AI-assisted engineering",
    "solo developer",
    "software economics",
    "AI pair programming",
    "developer productivity",
    "continuous deployment",
    "LLM development",
  ],
  openGraph: {
    title: "The Shift | bradley.io",
    description:
      "How AI rewrites the economics of building software — one person, 8 domains, 135K messages, 0 meetings.",
    url: "https://bradley.io/the-shift",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Shift | bradley.io",
    description:
      "How AI rewrites the economics of building software — a data-driven thesis on the new model.",
  },
}

export default function TheShiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": "https://bradley.io/the-shift",
            headline: "The Shift: How AI Rewrites the Economics of Building Software",
            description:
              "A data-driven thesis on how AI fundamentally changes the economics, velocity, and team structure of software development.",
            url: "https://bradley.io/the-shift",
            author: {
              "@type": "Person",
              name: "Bradley",
              url: "https://bradley.io",
            },
            publisher: {
              "@type": "Person",
              name: "Bradley",
              url: "https://bradley.io",
            },
            datePublished: "2026-03-26",
            dateModified: "2026-03-26",
            mainEntityOfPage: "https://bradley.io/the-shift",
            about: [
              { "@type": "Thing", name: "Artificial Intelligence in Software Development" },
              { "@type": "Thing", name: "Developer Productivity" },
              { "@type": "Thing", name: "Software Economics" },
            ],
            keywords:
              "AI-assisted development, software economics, developer productivity, Claude Code, solo engineering, continuous deployment",
          }),
        }}
      />
      {children}
    </>
  )
}
