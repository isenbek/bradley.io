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
import { RegisterSW } from "@/components/pwa/RegisterSW"

// Bricolage (display) — used for h1, hero text, big numbers. Brand-critical.
// `swap` so the webfont always wins; next/font auto-generates a metric-
// matched fallback so the swap is visually quiet.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-v3-display",
  display: "swap",
})

// Hanken (body) — used for paragraphs, lede, prose. The LCP element on
// most pages is a body-font <p>. Using `optional` so Lighthouse measures
// LCP at fallback render (instant after FCP) rather than waiting for the
// webfont swap. With `adjustFontFallback: true` (default), next/font writes
// a size-adjust'd fallback @font-face so the layout doesn't shift if the
// webfont does arrive. Slow-network users keep the fallback for the page
// session — a 5% identity cost in exchange for ~Good LCP for everyone.
const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-v3-body",
  display: "optional",
  adjustFontFallback: true,
})

// Baloo (logo) — only used on the bio·bradley.io wordmark; small surface
// area, fine to keep on `optional`.
const logo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-v3-logo",
  display: "optional",
})

// JetBrains Mono — used on monospace labels / numerals throughout the UI.
// Visual character matters less than body / display, `optional` keeps it
// off the LCP critical path.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-v3-mono",
  display: "optional",
})

export const metadata: Metadata = {
  title: {
    default: "Bradley Isenbek: Hardware Hacker, Data Architect, AI Pilot",
    template: "%s | Bradley Isenbek",
  },
  description:
    "Bradley Isenbek: AI Systems Architect, hardware hacker, and frontier technologist building at the intersection of enterprise scale and maker culture. ESP32 mesh networks to Fortune 500 data warehouses, with Claude as co-pilot.",
  metadataBase: new URL("https://bradley.io"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Bradley Isenbek: Hardware Hacker, Data Architect, AI Pilot",
    description:
      "AI Systems Architect & frontier technologist. Building at the intersection of enterprise scale and maker culture: from ESP32 mesh networks to Fortune 500 data warehouses.",
    url: "https://bradley.io",
    siteName: "bio·bradley.io",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bradley Isenbek: Hardware Hacker, Data Architect, AI Pilot",
    description:
      "AI Systems Architect & frontier technologist. Enterprise scale meets maker culture: ESP32 mesh networks to Fortune 500 warehouses, with Claude as co-pilot.",
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
  // iOS add-to-home-screen: standalone chrome, branded title + status bar.
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "bradley.io" },
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
        {/* Set the theme before first paint — no flash. Reads the saved choice,
            else falls back to the OS preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('bio-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();",
          }}
        />
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
                    "Bradley Isenbek: hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture.",
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
                  name: "Bradley Isenbek: AI & Data Engineering Consulting",
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
        <RegisterSW />
        <div className="v3">
          <V3Nav />
          <main>{children}</main>
          <V3Footer />
        </div>
      </body>
    </html>
  )
}
