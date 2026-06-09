"use client"

import { usePathname, useSearchParams } from "next/navigation"
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
  const pathname = usePathname()
  const isPrintMode = searchParams.get("print") === "true"
  const isV3 = pathname?.startsWith("/v3") ?? false

  if (isV3) {
    return <>{children}</>
  }

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
      <main className="min-h-dvh pt-16 pb-14 sm:pb-16">
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
