"use client"

import { useEffect, useState } from "react"

/**
 * Embeds a self-contained single-file instrument (prime-orchestra.html,
 * prime-zoo.html) in a self-sizing iframe. The static page posts its document
 * height (postMessage `{t:"po-h"}`) whenever it resizes; we clamp and apply it
 * so there's no inner scrollbar.
 */
export function ProjectEmbed({
  src,
  title,
  initialHeight = 1320,
}: {
  src: string
  title: string
  initialHeight?: number
}) {
  const [height, setHeight] = useState(initialHeight)

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
      <iframe src={src} title={title} loading="lazy" style={{ height }} />
    </div>
  )
}
