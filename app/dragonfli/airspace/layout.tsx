import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Airspace Map — bio·bradley.io",
  description:
    "Live ADS-B aircraft on a self-hosted vector map of the Great Lakes — with a 15-minute density forecast, per-aircraft trajectory ribbons, and an RSSI reception bloom. Fed by the Dragonfli 1090 MHz receiver.",
  alternates: { canonical: "/dragonfli/airspace" },
  openGraph: {
    title: "Airspace Map — the sky over Grand Rapids, mapped",
    description:
      "Live aircraft, a 15-minute ML density forecast, trajectory ribbons, and a signal-strength bloom — on a self-hosted vector basemap.",
    url: "https://bradley.io/dragonfli/airspace",
    type: "website",
  },
}

export default function V3AirspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
