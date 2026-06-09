import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TRNG — bio·bradley.io",
  description:
    "Live status for the HOTBITS true random number generator — radioactive decay timing from a CAJOE Geiger counter, with NIST-style continuous health checks.",
  alternates: { canonical: "/v3/trng" },
  openGraph: {
    title: "TRNG — bio·bradley.io",
    description:
      "Live entropy from radioactive decay — bias, ones %, pileup, NIST continuous health.",
    url: "https://bradley.io/v3/trng",
    type: "website",
  },
}

export default function V3TrngLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
