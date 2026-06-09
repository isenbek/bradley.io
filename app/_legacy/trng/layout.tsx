import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hotbits TRNG · bradley.io",
  description:
    "Live status for the Hotbits true random number generator — entropy harvested from radioactive decay on a Pi 4 Geiger counter.",
}

export default function TRNGLayout({ children }: { children: React.ReactNode }) {
  return children
}
