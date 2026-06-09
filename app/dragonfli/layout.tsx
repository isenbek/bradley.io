import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dragonfli — bio·bradley.io",
  description:
    "Live ADS-B receiver at 1090 MHz — local radar, active aircraft, FAA registry breakdown, and trajectory predictor.",
  alternates: { canonical: "/dragonfli" },
  openGraph: {
    title: "Dragonfli — bio·bradley.io",
    description:
      "Live 1090 MHz ADS-B receiver — radar, active aircraft, FAA registry, predictor.",
    url: "https://bradley.io/dragonfli",
    type: "website",
  },
}

export default function V3DragonfliLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
