import type { Metadata } from "next"
import "./globals.css"
// bradley.io's own rules for the kit routes. Loaded here because the layout that
// used to import it (app/beta/layout.tsx) went away at the cutover: the kit
// routes no longer share a path prefix, so there is no nested layout to hang it
// on. The vendored kit itself is @imported from globals.css, which is where the
// note about why that has to be a CSS import lives.
import "./kit.css"
import { SiteChrome } from "@/components/SiteChrome"
import { RegisterSW } from "@/components/pwa/RegisterSW"

// Fonts come from the vendored style kit (app/beta/kit/fonts.css): Archivo
// plus IBM Plex Sans/Mono/Serif, self-hosted, @imported via globals.css.
//
// Four next/font/local faces used to be declared here for the v3 design
// (Bricolage, Hanken, Baloo, JetBrains Mono). v3.css is gone and nothing reads
// --font-v3-* any more, so they were four fonts fetched on every page load for
// no rendered glyph. The files are still in app/fonts/ if any of them is ever
// wanted back; scripts/vendor-fonts.sh still refreshes them.

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
    // The kit's --color-paper. The dark value below still serves the v3
    // routes, which are the only ones that answer the theme toggle.
    { media: "(prefers-color-scheme: light)", color: "#F4F2EC" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
                    addressLocality: "Forest Hills",
                    addressRegion: "MI",
                    addressCountry: "US",
                  },
                  homeLocation: {
                    "@type": "Place",
                    name: "Forest Hills, Michigan",
                    geo: { "@type": "GeoCoordinates", latitude: 42.958, longitude: -85.49 },
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
                  areaServed: [
                    { "@type": "AdministrativeArea", name: "Kent County, Michigan" },
                    { "@type": "City", name: "Grand Rapids, Michigan" },
                    { "@type": "City", name: "Forest Hills, Michigan" },
                    { "@type": "City", name: "Ada, Michigan" },
                    { "@type": "City", name: "Cascade, Michigan" },
                    { "@type": "City", name: "Kentwood, Michigan" },
                  ],
                  serviceType: [
                    "Data Engineering",
                    "Distributed Systems Architecture",
                    "AI/ML Integration",
                    "Edge Computing & IoT",
                    "API Design & Development",
                  ],
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Forest Hills",
                    addressRegion: "MI",
                    addressCountry: "US",
                  },
                  geo: { "@type": "GeoCoordinates", latitude: 42.958, longitude: -85.49 },
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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
