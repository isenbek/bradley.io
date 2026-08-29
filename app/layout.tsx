import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import "./v3.css"
// bradley.io's own rules for the kit routes. Loaded here because the layout that
// used to import it (app/beta/layout.tsx) went away at the cutover: the kit
// routes no longer share a path prefix, so there is no nested layout to hang it
// on. The vendored kit itself is @imported from globals.css, which is where the
// note about why that has to be a CSS import lives.
import "./kit.css"
import { SiteChrome } from "@/components/SiteChrome"
import { RegisterSW } from "@/components/pwa/RegisterSW"

// ─── FONTS ARE VENDORED LOCALLY ────────────────────────────────────────────
// These were next/font/google until 2026-08-15, when Turbopack's Google-font
// resolution started failing intermittently — three build failures in an hour,
// each only clearable with `rm -rf .next/cache`, and one of them took the live
// stylesheet down. A build that reaches out to Google every time is a build
// that fails whenever Google, DNS, or a cache feels like it. Anti-Cloud, Host
// Local: the font files now live in app/fonts/ and the build touches nothing
// off this machine.
//
// All four are VARIABLE fonts, so one file per family covers every weight —
// hence the `weight: "min max"` ranges rather than a list.
//
// To refresh a family: scripts/vendor-fonts.sh

// Bricolage (display) — h1, hero text, big numbers. Brand-critical.
// `swap` so the webfont always wins.
const display = localFont({
  src: "./fonts/bricolage.woff2",
  weight: "200 800",
  variable: "--font-v3-display",
  display: "swap",
  adjustFontFallback: "Arial",
})

// Hanken (body) — used for paragraphs, lede, prose. The LCP element on
// most pages is a body-font <p>. Using `optional` so Lighthouse measures
// LCP at fallback render (instant after FCP) rather than waiting for the
// webfont swap. With `adjustFontFallback: true` (default), next/font writes
// a size-adjust'd fallback @font-face so the layout doesn't shift if the
// webfont does arrive. Slow-network users keep the fallback for the page
// session — a 5% identity cost in exchange for ~Good LCP for everyone.
const body = localFont({
  src: "./fonts/hanken.woff2",
  weight: "100 900",
  variable: "--font-v3-body",
  display: "optional",
  // With a local font next/font can't read Google's metric metadata, so the
  // fallback is metric-matched against Arial instead of the real face. Close
  // enough for a grotesk of this proportion; the alternative is layout shift.
  adjustFontFallback: "Arial",
})

// Baloo (logo) — only used on the bio·bradley.io wordmark; small surface
// area, fine to keep on `optional`.
const logo = localFont({
  src: "./fonts/baloo2.woff2",
  weight: "400 800",
  variable: "--font-v3-logo",
  display: "optional",
  adjustFontFallback: "Arial",
})

// JetBrains Mono — used on monospace labels / numerals throughout the UI.
// Visual character matters less than body / display, `optional` keeps it
// off the LCP critical path.
const mono = localFont({
  src: "./fonts/jetbrains.woff2",
  weight: "100 800",
  variable: "--font-v3-mono",
  display: "optional",
  // Arial-based metric adjustment would be wrong for a monospace face — let
  // the real monospace stack carry the fallback instead.
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
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
