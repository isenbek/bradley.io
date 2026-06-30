"use client"

import { useEffect, useRef } from "react"

// Thin React mount point for the framework-free scanner module. The actual logic
// lives in /public/preferences/scanner.js (vanilla, liftable) — we just load it
// and hand it a host element so the same code runs here and in standalone.html.
type Scanner = { mount: (el: HTMLElement) => void }

export function PreferencesClient() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const win = window as unknown as { BradleyScanner?: Scanner }
    const run = () => win.BradleyScanner?.mount(host)
    const existing = document.querySelector<HTMLScriptElement>('script[data-bsc]')
    if (win.BradleyScanner) {
      run()
      return
    }
    const s = existing ?? document.createElement("script")
    if (!existing) {
      s.src = "/preferences/scanner.js"
      s.async = true
      s.dataset.bsc = "1"
      document.body.appendChild(s)
    }
    s.addEventListener("load", run, { once: true })
    return () => s.removeEventListener("load", run)
  }, [])

  return <div ref={ref} className="v3-prefs__mount" />
}
