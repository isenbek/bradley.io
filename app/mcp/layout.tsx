import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MCP Catalog · bio·bradley.io",
  description:
    "Campaign Brain MCP catalog: FastAPI microservices for AI, data, communication, infrastructure, and business operations.",
  alternates: { canonical: "/mcp" },
  openGraph: {
    title: "MCP Catalog · bio·bradley.io",
    description:
      "Campaign Brain MCP services: AI, data, communication, infrastructure, business. All open via MCP to LLM agents.",
    url: "https://bradley.io/mcp",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Catalog · bio·bradley.io",
    description:
      "Campaign Brain MCP services: AI, data, communication, infrastructure, business. All open via MCP to LLM agents.",
  },
}

export default function V3McpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/mcp",
            url: "https://bradley.io/mcp",
            name: "MCP Catalog · Campaign Brain",
            description:
              "Catalog of Campaign Brain MCP microservices: AI, data, communication, infrastructure, business.",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "MCP Catalog", item: "https://bradley.io/mcp" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
