import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/eyes", "/eyes.png"],
    },
    sitemap: "https://bradley.io/sitemap.xml",
    host: "https://bradley.io",
  }
}
