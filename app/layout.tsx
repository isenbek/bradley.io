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
// The three font files every first screen draws with. See FIRST_SCREEN_FONTS.
// @ts-expect-error -- no ambient type for a font import; the bundler resolves it to the asset's URL
import archivo800 from "./beta/kit/fonts/Archivo-800-latin.woff2"
// @ts-expect-error -- as above
import plexSerif400 from "./beta/kit/fonts/IBMPlexSerif-400-latin.woff2"
// @ts-expect-error -- as above
import plexMono400 from "./beta/kit/fonts/IBMPlexMono-400-latin.woff2"

// Fonts come from the vendored style kit (app/beta/kit/fonts.css): Archivo
// plus IBM Plex Sans/Mono/Serif, self-hosted, @imported via globals.css.
//
// Four next/font/local faces used to be declared here for the v3 design
// (Bricolage, Hanken, Baloo, JetBrains Mono). v3.css is gone and nothing reads
// --font-v3-* any more, so they were four fonts fetched on every page load for
// no rendered glyph. The files are still in app/fonts/ if any of them is ever
// wanted back; scripts/vendor-fonts.sh still refreshes them.

/**
 * The font files preloaded on every page.
 *
 * The kit's fonts.css declares every face with font-display: swap, and a
 * browser does not fetch a face until it has the stylesheet AND has laid out
 * text that uses it. So the first paint was in the fallback faces and the
 * real ones landed a few hundred milliseconds later, re-wrapping the lede and
 * pushing everything under it down: measured on /about on 2026-10-02, 28px at
 * 390 wide and 54px at 320. A preload starts the fetch with the HTML instead,
 * beside the stylesheet, so the faces are there for the first paint.
 *
 * Which three, measured rather than guessed: the faces with visible text in
 * the first viewport on all ten routes sampled (home, about, work, projects,
 * services, resume, contact, papers, ai-pilot, trng) at 390 and at 1280 wide.
 * Archivo 800 is the wordmark and every h1, Plex Serif 400 is the lede and
 * the prose, Plex Mono 400 is the crumb and the primary row. Together 60 KB.
 * Plex Sans 400 is on the first screen of some routes and not others, and at
 * 40 KB it is not worth racing the stylesheet for on the pages without it.
 *
 * Imported, not typed out as a path: the URL carries a content hash, and the
 * import is the same asset the stylesheet's url() points at, so the two agree
 * by construction. If a bundler ever hands back something that is not a URL
 * the entry is dropped and the page is what it was before, late fonts and all.
 * A preload that does NOT match what the stylesheet asks for is worse than
 * none (the file is fetched twice), so after a bundler change, check that
 * these three hrefs appear in the page's CSS.
 */
const fontUrl = (m: unknown): string | null => {
  if (typeof m === "string") return m
  const src = (m as { src?: unknown } | null)?.src
  return typeof src === "string" ? src : null
}
const FIRST_SCREEN_FONTS = [archivo800, plexSerif400, plexMono400]
  .map(fontUrl)
  .filter((href): href is string => href !== null)

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
    // The browser's own chrome, not the page: the page is one ground whatever
    // the OS prefers. A dark-mode browser gets a dark bar above the paper, a
    // light one gets the kit's --color-paper.
    { media: "(prefers-color-scheme: dark)", color: "#252521" },
    { media: "(prefers-color-scheme: light)", color: "#F4F2EC" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning, and why it is not a cover-up. The script below
    // puts data-theme on this element while the document is still being
    // parsed, which is before React hydrates it. The server cannot know the
    // value (it is the visitor's OS colour scheme), so the server HTML never
    // has the attribute and the browser's always does: React reported that on
    // every route. The difference is intended and is this one attribute. The
    // flag silences attribute differences on <html> itself and nothing below
    // it, so a real mismatch anywhere in the page is still reported.
    <html lang="en" suppressHydrationWarning>
      <head>
        {FIRST_SCREEN_FONTS.map((href) => (
          // crossOrigin even though it is this origin: a font is always
          // fetched in anonymous CORS mode, and a preload without it is a
          // different request that the font load cannot reuse.
          <link
            key={href}
            rel="preload"
            as="font"
            type="font/woff2"
            href={href}
            crossOrigin="anonymous"
          />
        ))}
        {/* The visitor's OS colour scheme, as data-theme on <html>. The site
            itself is one ground and ignores it (app/kit.css pins the ground
            under the attribute). Its one reader is the bio-mark x-ray
            (components/kit/BioMarkFrame.tsx), which copies it into its iframe
            so the drawing board is dark for a reader whose system is.
            This used to read a saved choice (localStorage "bio-theme") first.
            The switch that wrote that key went away with v3, so a visitor who
            had ever used it was held to that answer with nothing left to
            change it. The OS preference is the only input now. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{document.documentElement.dataset.theme=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch(e){}})();",
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
