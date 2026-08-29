"use client"

import { usePathname } from "next/navigation"
import { V3Nav } from "@/components/v3/V3Nav"
import { V3Footer } from "@/components/v3/V3Footer"
import { V3Colophon } from "@/components/v3/V3Colophon"
import { KitShell } from "@/components/KitShell"
import { KIT_ROUTES } from "@/app/_nav"

/**
 * Picks the shell per route: the tinymachines style kit, or v3.
 *
 * bradley.io runs two designs at once, deliberately and temporarily. The eleven
 * routes in KIT_ROUTES were rebuilt on the kit and hold the canonical paths.
 * Everything else, the live instruments and the project and lab archives, still
 * runs v3 and stays exactly as it was rather than being dropped or redirected
 * into nothing.
 *
 * The branch has to live here rather than in a layout, twice over. A kit page
 * cannot sit inside `.v3`, because that wrapper is what scopes every rule in
 * app/v3.css and a kit page nested in it inherits v3's type and colour under kit
 * markup. And the kit routes no longer share a path prefix a layout could match:
 * they are at /, /about, /papers, interleaved with v3 routes at the same depth.
 *
 * `children` arrives as a prop, so the page subtree stays server-rendered. This
 * component is a client boundary; the pages inside it are not.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""

  // Exact match, not a prefix test: "/" is in the set and prefix-matching it
  // would swallow the entire site.
  const isKit = KIT_ROUTES.has(pathname === "/" ? "/" : pathname.replace(/\/+$/, ""))

  if (isKit) return <KitShell>{children}</KitShell>

  return (
    <div className="v3">
      <V3Nav />
      <main>{children}</main>
      <V3Colophon />
      <V3Footer />
    </div>
  )
}
