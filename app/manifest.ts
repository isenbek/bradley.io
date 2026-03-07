import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "bradley.io",
    short_name: "bradley.io",
    description:
      "Hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture.",
    start_url: "/",
    display: "standalone",
    background_color: "#1C1412",
    theme_color: "#F59E0B",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
