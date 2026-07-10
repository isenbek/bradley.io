"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// The bio·mark vector x-ray is a self-contained HTML doc in public/bio-mark.html.
// It posts its content height to us so the iframe grows to fit — meaning the page
// scrolls naturally instead of trapping a nested scroll region (key on mobile).
// We also mirror the site's light/dark theme into it (same-origin).
export function BioMarkFrame() {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState<number | null>(null)

  // push the current site theme into the embedded doc
  const syncTheme = useCallback(() => {
    const doc = ref.current?.contentDocument
    if (!doc) return
    const t = document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    doc.documentElement.dataset.theme = t
  }, [])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== ref.current?.contentWindow) return
      const data = e.data
      if (data && data.type === "bio-mark:height" && typeof data.height === "number") {
        setHeight(Math.max(480, Math.round(data.height)))
        syncTheme() // the child is ready (it posts height on load) — apply the theme
      }
    }
    window.addEventListener("message", onMessage)
    // re-sync whenever the site flips the theme (ThemeToggle sets <html data-theme>)
    const obs = new MutationObserver(syncTheme)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    // belt-and-suspenders: the iframe may have loaded before this effect ran, so
    // poll briefly until its document is reachable, then stop.
    let tries = 0
    const id = setInterval(() => {
      tries++
      if (ref.current?.contentDocument?.documentElement) syncTheme()
      if (tries > 20) clearInterval(id)
    }, 150)
    return () => {
      window.removeEventListener("message", onMessage)
      obs.disconnect()
      clearInterval(id)
    }
  }, [syncTheme])

  return (
    <iframe
      ref={ref}
      src="/bio-mark.html"
      title="The bio mark: chords, offsets & the implied infinity (interactive vector x-ray)"
      className="v3-embed-stage__frame"
      style={height ? { height } : undefined}
      scrolling="no"
      onLoad={syncTheme}
    />
  )
}
