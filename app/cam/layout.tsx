import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Live Camera — bio·bradley.io",
  description:
    "A live frame from the camera on the bradley.io box — grabbed once a minute with ffmpeg, cached locally, and served straight off the metal. Anti-cloud, host local.",
  alternates: { canonical: "/cam" },
  openGraph: {
    title: "Live Camera — a frame, once a minute",
    description:
      "A self-hosted frame grab from the attached camera, cached on the box and refreshed every minute. No stream, no cloud.",
    url: "https://bradley.io/cam",
    type: "website",
  },
}

export default function CamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
