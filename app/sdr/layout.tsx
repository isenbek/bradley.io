import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "sdr-api · bradley.io",
  description:
    "Live status for the SDR scanner stack — band registry, soak archive, top frequencies, and job history from an rtl-sdr on bali.lan.",
}

export default function SDRLayout({ children }: { children: React.ReactNode }) {
  return children
}
