"use client"

import { usePathname } from "next/navigation"
import { V3Nav } from "@/components/v3/V3Nav"
import { V3Footer } from "@/components/v3/V3Footer"
import { V3Colophon } from "@/components/v3/V3Colophon"

/**
 * Picks the shell: v3 for the live site, nothing for /beta.
 *
 * /beta runs the tinymachines style kit, which brings its own masthead, its own
 * footer and its own ground. It cannot sit inside `.v3`, because that wrapper is
 * what scopes every rule in app/v3.css: a beta page nested in it inherits v3's
 * type, colour and spacing under kit markup, and the result reads as neither.
 *
 * So the branch is here rather than in app/beta/layout.tsx. A nested layout can
 * add chrome but it cannot remove chrome the root layout already rendered, and
 * the root layout is a server component with no way to know the path. The
 * canonical fix is two root layouts under route groups, which means relocating
 * ~60 existing routes; this is the same outcome for one client component, and it
 * stops being needed the day beta becomes the site.
 *
 * `children` arrives as a prop, so the page subtree stays server-rendered. This
 * component is a client boundary; the pages inside it are not.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const isBeta = pathname === "/beta" || pathname.startsWith("/beta/")

  if (isBeta) return <>{children}</>

  return (
    <div className="v3">
      <V3Nav />
      <main>{children}</main>
      <V3Colophon />
      <V3Footer />
    </div>
  )
}
