import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Eyes — bio·bradley.io",
  description:
    "A live frame from the camera on the bradley.io box — grabbed once a minute with ffmpeg, cached locally, and served straight off the metal. Anti-cloud, host local.",
  alternates: { canonical: "/eyes" },
  // Unpublished: live at the URL, but not advertised or indexed.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Eyes — a frame, once a minute",
    description:
      "A self-hosted frame grab from the attached camera, cached on the box and refreshed every minute. No stream, no cloud.",
    url: "https://bradley.io/eyes",
    type: "website",
  },
  // Large-image card so the live frame fills the preview on iOS / X / Slack.
  twitter: {
    card: "summary_large_image",
    title: "Eyes — a frame, once a minute",
    description:
      "The latest still from the camera on the bradley.io box, framed and refreshed every minute.",
  },
}

export default function EyesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
