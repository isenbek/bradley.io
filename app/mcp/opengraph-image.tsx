import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "MCP Service Catalog — 22 FastAPI services, 85+ endpoints"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "MCP Catalog",
    title: "22 services. 85+ endpoints.",
    subtitle:
      "Campaign Brain FastAPI microservices — fully indexed, OpenAPI-introspected, and callable from any MCP client.",
    tags: ["FastAPI", "OpenAPI", "MCP", "Microservices"],
    accent: "blue",
  })
}
