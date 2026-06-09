import type { Metadata } from "next"
import { Bricolage_Grotesque, Hanken_Grotesk, Baloo_2, JetBrains_Mono } from "next/font/google"
import "./v3.css"
import { V3Nav } from "./_components/V3Nav"
import { V3Footer } from "./_components/V3Footer"

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
  title: "bio·bradley.io — refactor preview",
  description:
    "v3 brand refactor of bradley.io — bright, organic, fluid. Bio Blue primary with coral, gold, and green accents.",
  alternates: { canonical: "/v3" },
  openGraph: {
    title: "bio·bradley.io — v3 brand refactor",
    description:
      "Bright, organic, fluid identity for bradley.io. Bio Blue with three living accents.",
    url: "https://bradley.io/v3",
    type: "website",
  },
}

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`v3 ${display.variable} ${body.variable} ${logo.variable} ${mono.variable}`}>
      <V3Nav />
      <main>{children}</main>
      <V3Footer />
    </div>
  )
}
