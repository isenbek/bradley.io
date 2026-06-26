import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "GPS — bio·bradley.io",
  description:
    "Live GNSS from the Dragonfli receiver — a satellite skyplot by SNR, the signal spectrum, the fix-precision cloud, and the ground track on a self-hosted vector basemap.",
  alternates: { canonical: "/dragonfli/gps" },
  openGraph: {
    title: "GPS — the sky, from the ground up",
    description:
      "Live satellite skyplot, SNR spectrum, fix-precision cloud, and ground track — off the same receiver that feeds the airspace map.",
    url: "https://bradley.io/dragonfli/gps",
    type: "website",
  },
}

export default function GpsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
