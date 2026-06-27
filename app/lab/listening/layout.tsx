import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The math of listening — field note · bradley.io",
  description:
    "A low-level DSP walkthrough from raw 16-bit samples to a working voice gate: the real FFT, Hann windowing (200× less leakage), spectral-subtraction denoise (and its U-curve), and the energy gate — every number from a live run on a salvaged home server's microphones.",
  alternates: { canonical: "/lab/listening" },
  openGraph: {
    title: "The math of listening",
    description:
      "Samples → FFT → windowing → spectral subtraction → voice gate. A low-level DSP field note, every number from a live run.",
    url: "https://bradley.io/lab/listening",
    type: "article",
  },
}

export default function ListeningLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
