import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // NB: /eyes is deliberately NOT disallowed — a Disallow would also block
      // /eyes/opengraph-image, killing the iOS/social link-unfurl preview. The
      // page stays unpublished via its noindex meta (app/eyes/layout.tsx) and by
      // not being linked anywhere.
      disallow: ["/api/"],
    },
    sitemap: "https://bradley.io/sitemap.xml",
    host: "https://bradley.io",
  }
}
