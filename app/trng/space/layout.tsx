import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Entropy Space — bio·bradley.io",
  description:
    "Live 3D visualizations of true randomness from radioactive decay — a rotatable entropy cube, return map, scrolling bit-raster, and a 24h quality phase-space, all fed by the HOTBITS TRNG.",
  alternates: { canonical: "/trng/space" },
  openGraph: {
    title: "Entropy Space — what does randomness look like?",
    description:
      "Rotatable 3D point clouds of live radioactive-decay entropy — true noise fills space; a broken PRNG can't hide its planes.",
    url: "https://bradley.io/trng/space",
    type: "website",
  },
}

export default function V3EntropySpaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
