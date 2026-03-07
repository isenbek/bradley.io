import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/wargames-test/"],
    },
    sitemap: "https://bradley.io/sitemap.xml",
  }
}
