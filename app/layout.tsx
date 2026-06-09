import type { Metadata } from "next"
import {
  Bricolage_Grotesque,
  Hanken_Grotesk,
  Baloo_2,
  JetBrains_Mono,
} from "next/font/google"
import "./globals.css"
import "./v3.css"
import { V3Nav } from "@/components/v3/V3Nav"
import { V3Footer } from "@/components/v3/V3Footer"

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-v3-display",
  display: "swap",
})

const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-v3-body",
  display: "swap",
})

const logo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-v3-logo",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-v3-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Bradley Isenbek — Hardware Hacker, Data Architect, AI Pilot",
    template: "%s | Bradley Isenbek",
  },
  description:
    "Bradley Isenbek — AI Systems Architect, hardware hacker, and frontier technologist building at the intersection of enterprise scale and maker culture. ESP32 mesh networks to Fortune 500 data warehouses, with Claude as co-pilot.",
  metadataBase: new URL("https://bradley.io"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Bradley Isenbek — Hardware Hacker, Data Architect, AI Pilot",
    description:
      "AI Systems Architect & frontier technologist. Building at the intersection of enterprise scale and maker culture — from ESP32 mesh networks to Fortune 500 data warehouses.",
    url: "https://bradley.io",
    siteName: "bio·bradley.io",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bradley Isenbek — Hardware Hacker, Data Architect, AI Pilot",
    description:
      "AI Systems Architect & frontier technologist. Enterprise scale meets maker culture — ESP32 mesh networks to Fortune 500 warehouses, with Claude as co-pilot.",
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
    "Bradley Isenbek",
    "Brad Isenbek",
    "Bradley S. Isenbek",
    "Isenbek",
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
  publisher: "Bradley Isenbek",
  applicationName: "bio·bradley.io",
  category: "technology",
  formatDetection: { email: false, address: false, telephone: false },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#252521" },
    { media: "(prefers-color-scheme: light)", color: "#FBFAF5" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${logo.variable} ${mono.variable}`}>
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
                  alternateName: [
                    "Brad Isenbek",
                    "Bradley S. Isenbek",
                    "B. Isenbek",
                  ],
                  givenName: "Bradley",
                  additionalName: "S.",
                  familyName: "Isenbek",
                  url: "https://bradley.io",
                  mainEntityOfPage: "https://bradley.io/about",
                  jobTitle: "Frontier Technologist",
                  description:
                    "Bradley Isenbek — hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture.",
                  hasOccupation: {
                    "@type": "Occupation",
                    name: "AI Systems Architect",
                    occupationalCategory: "15-1299 Computer Occupations",
                    skills: [
                      "AI Engineering",
                      "Data Architecture",
                      "Distributed Systems",
                      "Edge Computing",
                      "Machine Learning",
                    ],
                  },
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
                    "FastAPI",
                    "PostgreSQL",
                    "Environmental Data Science",
                  ],
                  knowsLanguage: ["en"],
                  nationality: { "@type": "Country", name: "United States" },
                  worksFor: { "@id": "https://bradley.io/#service" },
                  sameAs: [
                    "https://github.com/isenbek",
                    "https://github.com/tinymachines",
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
                  name: "bio·bradley.io",
                  publisher: { "@id": "https://bradley.io/#person" },
                  inLanguage: "en-US",
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <div className="v3">
          <V3Nav />
          <main>{children}</main>
          <V3Footer />
        </div>
      </body>
    </html>
  )
}
