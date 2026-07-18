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
  fixed = false,
}: {
  src: string
  title: string
  initialHeight?: number
  /** For full-viewport instruments (the atlas) that size themselves to the
   *  frame instead of reporting a document height. Uses a viewport-relative
   *  CSS height and skips the message listener entirely. */
  fixed?: boolean
}) {
  const [height, setHeight] = useState(initialHeight)

  useEffect(() => {
    if (fixed) return
    function onMessage(e: MessageEvent) {
      const d = e.data as { t?: string; h?: number } | null
      if (d && d.t === "po-h" && typeof d.h === "number") {
        setHeight(Math.max(700, Math.min(3200, Math.ceil(d.h))))
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [fixed])

  return (
    <div className={fixed ? "v3-po-embed v3-po-embed--fixed" : "v3-po-embed"}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        style={fixed ? undefined : { height }}
      />
    </div>
  )
}
