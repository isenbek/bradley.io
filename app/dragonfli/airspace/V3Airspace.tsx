"use client"

import dynamic from "next/dynamic"

// MapLibre is heavy and touches window — load it client-only and route-scoped
// so it never enters the server bundle or any other page.
const AirspaceMap = dynamic(() => import("@/components/dragonfli/airspace/AirspaceMap"), {
  ssr: false,
  loading: () => (
    <div className="v3-air__loading">
      <span className="v3-air__loading-dot" aria-hidden />
      bringing up the map…
    </div>
  ),
})

export function V3Airspace() {
  return <AirspaceMap />
}
