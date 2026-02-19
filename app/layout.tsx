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
  description: "Hardware hacker, data architect, and AI pilot. Building at the intersection of enterprise scale and maker culture — from ESP32 mesh networks to Fortune 500 data warehouses.",
  openGraph: {
    title: "bradley.io",
    description: "Frontier Technologist",
    type: "website",
  },
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
      <body>
        <RootLayoutWrapper>
          {children}
        </RootLayoutWrapper>
      </body>
    </html>
  )
}
