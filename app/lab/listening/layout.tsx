import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The math of listening: field note · bradley.io",
  description:
    "A low-level DSP walkthrough from raw 16-bit samples to a working voice gate: the real FFT, Hann windowing (200× less leakage), spectral-subtraction denoise (and its U-curve), and the energy gate. Every number from a live run on a salvaged home server's microphones.",
  alternates: { canonical: "/lab/listening" },
  openGraph: {
    title: "The math of listening",
    description:
      "Samples → FFT → windowing → spectral subtraction → voice gate. A low-level DSP field note, every number from a live run.",
    url: "https://bradley.io/lab/listening",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The math of listening",
    description:
      "Samples → FFT → windowing → spectral subtraction → voice gate. A low-level DSP field note, every number from a live run.",
  },
}

export default function ListeningLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "@id": "https://bradley.io/lab/listening",
            url: "https://bradley.io/lab/listening",
            headline: "The math of listening",
            description:
              "A low-level DSP walkthrough from raw 16-bit samples to a working voice gate: the real FFT, Hann windowing, spectral-subtraction denoise, and the energy gate. Every number from a live run.",
            author: { "@id": "https://bradley.io/#person" },
            publisher: { "@id": "https://bradley.io/#person" },
            mainEntityOfPage: "https://bradley.io/lab/listening",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Lab", item: "https://bradley.io/lab" },
                { "@type": "ListItem", position: 3, name: "The math of listening", item: "https://bradley.io/lab/listening" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
