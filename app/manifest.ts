import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bradley Isenbek · bradley.io",
    short_name: "bradley.io",
    description:
      "Hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#1C1412",
    theme_color: "#1C1412",
    categories: ["productivity", "developer", "technology"],
    lang: "en-US",
    dir: "ltr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon0", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon0", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon1", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon1", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  }
}
