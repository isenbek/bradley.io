"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Embeds the self-contained prime-orchestra.html instrument in a self-sizing
 * iframe. The static page posts its document height (postMessage `{t:"po-h"}`)
 * whenever it resizes; we clamp and apply it so there's no inner scrollbar.
 */
export function PrimeOrchestraEmbed() {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(1320)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data as { t?: string; h?: number } | null
      if (d && d.t === "po-h" && typeof d.h === "number") {
        setHeight(Math.max(700, Math.min(3200, Math.ceil(d.h))))
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return (
    <div className="v3-po-embed">
      <iframe
        ref={ref}
        src="/prime-orchestra.html"
        title="Prime Orchestra: a Riemann explicit-formula instrument"
        loading="lazy"
        style={{ height }}
      />
    </div>
  )
}
