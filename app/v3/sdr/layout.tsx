import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SDR — bio·bradley.io",
  description:
    "Live status for the SDR scanner stack — band registry, soak archive, top frequencies, and job history from rtl-sdr.",
  alternates: { canonical: "/v3/sdr" },
  openGraph: {
    title: "SDR — bio·bradley.io",
    description:
      "Live SDR scanner status — bands, soaks, top frequencies, jobs. Built on rtl-sdr.",
    url: "https://bradley.io/v3/sdr",
    type: "website",
  },
}

export default function V3SdrLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
