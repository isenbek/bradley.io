import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MCP Service Catalog",
  description:
    "Campaign Brain service catalog — 22 FastAPI microservices with 85+ endpoints across AI, data, communication, infrastructure, and business operations.",
  alternates: { canonical: "/mcp" },
  openGraph: {
    title: "MCP Service Catalog | bradley.io",
    description:
      "22 FastAPI microservices powering Campaign Brain — all accessible via MCP for LLM agents.",
    url: "https://bradley.io/mcp",
  },
}

export default function McpLayout({ children }: { children: React.ReactNode }) {
  return children
}
