import "../terminal.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terminal · bio·bradley.io",
  description:
    "The site as a command line. Type help: the resume, the projects, live instrument status, the build that is answering you, and a WOPR to play against.",
  alternates: { canonical: "/terminal" },
  openGraph: {
    title: "Terminal · bio·bradley.io",
    description:
      "The site as a command line. Type help to start poking around.",
    url: "https://bradley.io/terminal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terminal · bio·bradley.io",
    description:
      "The site as a command line. Type help to start poking around.",
  },
}

export default function V3TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/terminal",
            url: "https://bradley.io/terminal",
            name: "Terminal · bradley.io",
            description:
              "The site as a command line: resume, projects, live instrument status and build information, all through typed commands.",
            applicationCategory: "Portfolio",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Terminal", item: "https://bradley.io/terminal" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
