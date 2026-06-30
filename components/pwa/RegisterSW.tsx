"use client"

import { useEffect } from "react"

// Registers the service worker once, client-side. Kept tiny + side-effect only
// so it can sit in the root layout without pulling weight into every page.
export function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
    // register after load so it never competes with first paint / hydration
    const onReady = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* SW is progressive enhancement — ignore registration failures */
      })
    }
    if (document.readyState === "complete") onReady()
    else {
      window.addEventListener("load", onReady, { once: true })
      return () => window.removeEventListener("load", onReady)
    }
  }, [])
  return null
}
