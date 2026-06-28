"use client"

import { useEffect, useRef, useState } from "react"

// The bio·mark vector x-ray is a self-contained HTML doc in public/bio-mark.html.
// It posts its content height to us so the iframe grows to fit — meaning the page
// scrolls naturally instead of trapping a nested scroll region (key on mobile).
export function BioMarkFrame() {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // same-origin embed; ignore anything that isn't our height ping
      if (e.source !== ref.current?.contentWindow) return
      const data = e.data
      if (data && data.type === "bio-mark:height" && typeof data.height === "number") {
        setHeight(Math.max(480, Math.round(data.height)))
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return (
    <iframe
      ref={ref}
      src="/bio-mark.html"
      title="The bio mark — chords, offsets & the implied infinity (interactive vector x-ray)"
      className="v3-embed-stage__frame"
      style={height ? { height } : undefined}
      scrolling="no"
    />
  )
}
