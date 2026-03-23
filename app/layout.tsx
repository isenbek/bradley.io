import type { Metadata } from "next"
import { Outfit, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { RootLayoutWrapper } from "@/components/layout/RootLayoutWrapper"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "bradley.io | Frontier Technologist",
    template: "%s | bradley.io",
  },
  description:
    "Hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture — from ESP32 mesh networks to Fortune 500 data warehouses.",
  metadataBase: new URL("https://bradley.io"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "bradley.io | Frontier Technologist",
    description:
      "Hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture.",
    url: "https://bradley.io",
    siteName: "bradley.io",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "bradley.io — Hardware hacker, data architect, AI pilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bradley.io | Frontier Technologist",
    description:
      "Hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  keywords: [
    "AI engineer",
    "data architect",
    "hardware hacker",
    "ESP32",
    "Claude",
    "AI pilot",
    "edge computing",
    "IoT",
    "data engineering",
    "Grand Rapids",
    "Michigan",
  ],
  authors: [{ name: "Bradley Isenbek", url: "https://bradley.io" }],
  creator: "Bradley Isenbek",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": "https://bradley.io/#person",
                  name: "Bradley Isenbek",
                  url: "https://bradley.io",
                  jobTitle: "Frontier Technologist",
                  description:
                    "Hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture.",
                  knowsAbout: [
                    "AI Engineering",
                    "Data Architecture",
                    "Edge Computing",
                    "IoT",
                    "ESP32",
                    "Claude AI",
                    "Distributed Systems",
                    "Machine Learning",
                    "Python",
                    "TypeScript",
                  ],
                  sameAs: [
                    "https://github.com/tinymachines",
                    "https://github.com/isenbek",
                  ],
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Grand Rapids",
                    addressRegion: "MI",
                    addressCountry: "US",
                  },
                  image: "https://bradley.io/og-image.png",
                },
                {
                  "@type": "ProfessionalService",
                  "@id": "https://bradley.io/#service",
                  name: "Bradley Isenbek — AI & Data Engineering Consulting",
                  url: "https://bradley.io/services",
                  provider: { "@id": "https://bradley.io/#person" },
                  description:
                    "Consulting in data engineering, distributed systems, AI/ML integration, and edge computing.",
                  areaServed: "US",
                  serviceType: [
                    "Data Engineering",
                    "Distributed Systems Architecture",
                    "AI/ML Integration",
                    "Edge Computing & IoT",
                    "API Design & Development",
                  ],
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Grand Rapids",
                    addressRegion: "MI",
                    addressCountry: "US",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://bradley.io/#website",
                  url: "https://bradley.io",
                  name: "bradley.io",
                  publisher: { "@id": "https://bradley.io/#person" },
                  inLanguage: "en-US",
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <RootLayoutWrapper>
          {children}
        </RootLayoutWrapper>
      </body>
    </html>
  )
}
