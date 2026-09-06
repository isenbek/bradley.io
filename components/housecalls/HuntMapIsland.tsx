"use client"

import dynamic from "next/dynamic"

// MapLibre is heavy and touches window: client-only, route-scoped, same
// pattern as every GL board on the site.
const HuntMap = dynamic(() => import("@/components/housecalls/HuntMap"), {
  ssr: false,
  loading: () => (
    <div className="beta-air__loading">
      <span className="beta-air__loading-dot" aria-hidden />
      bringing up the territory…
    </div>
  ),
})

export function HuntMapIsland() {
  return <HuntMap />
}
