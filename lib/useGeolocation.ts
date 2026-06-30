"use client"

import { useEffect, useState } from "react"

export type GeoFix = {
  status: "idle" | "locating" | "ok" | "denied" | "unavailable" | "error"
  lon: number | null
  lat: number | null
  accuracy: number | null // metres
  heading: number | null // deg true, when moving
  ts: number | null
}

const INITIAL: GeoFix = { status: "idle", lon: null, lat: null, accuracy: null, heading: null, ts: null }

// Browser geolocation as a live hook — watchPosition with graceful permission
// handling. Distinct from the GPS *sensor* on the bus: this is the viewer's own
// device, so a map can show "you are here" next to the receiver's fix.
export function useGeolocation(enabled = true): GeoFix {
  const [fix, setFix] = useState<GeoFix>(INITIAL)

  useEffect(() => {
    if (!enabled) return
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setFix((f) => ({ ...f, status: "unavailable" }))
      return
    }
    setFix((f) => ({ ...f, status: "locating" }))
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setFix({
          status: "ok",
          lon: pos.coords.longitude,
          lat: pos.coords.latitude,
          accuracy: pos.coords.accuracy ?? null,
          heading: typeof pos.coords.heading === "number" && !Number.isNaN(pos.coords.heading) ? pos.coords.heading : null,
          ts: pos.timestamp,
        })
      },
      (err) => {
        setFix((f) => ({
          ...f,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
        }))
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [enabled])

  return fix
}
