"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Navigation } from "./Navigation"
import { VersionFooter } from "./VersionFooter"

const AmbientLayer = dynamic(
  () => import("@/components/ambient/AmbientLayer").then((m) => m.AmbientLayer),
  { ssr: false }
)

function LayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const isPrintMode = searchParams.get("print") === "true"

  if (isPrintMode) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    )
  }

  return (
    <>
      <Navigation />
      <AmbientLayer />
      <main className="min-h-dvh pt-16 pb-10 sm:pb-11">
        {children}
      </main>
      <VersionFooter />
    </>
  )
}

export function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="min-h-screen">{children}</main>}>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  )
}
