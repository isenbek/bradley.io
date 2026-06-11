"use client"

import { useEffect, useRef } from "react"

/**
 * V3Reveal — fade-up on scroll, mirrors the style guide's .reveal pattern.
 * Wraps children in a <div>; honors prefers-reduced-motion via the .v3-reveal CSS.
 *
 * **Use `eager` for above-the-fold content.** The default mode starts at
 * opacity:0 and only transitions visible after React hydrates and the
 * IntersectionObserver fires. On a slow CPU that adds ~1–3s to LCP. For
 * elements already on the first screen (hero h1, page-head h1, lede,
 * primary CTAs), eager renders them already-visible from first paint,
 * which is what LCP needs.
 */
export function V3Reveal({
  children,
  delay = 0,
  className = "",
  eager = false,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  /** Render in the visible state from first paint. Use for above-the-fold. */
  eager?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (eager) return
    const node = ref.current
    if (!node) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).classList.add("is-in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [eager])

  // For eager mode, render with `is-in` already applied so the SSR HTML
  // paints at full opacity and LCP is measured against the actual element,
  // not the post-animation revealed state.
  const cls = eager
    ? `v3-reveal is-in ${className}`.trim()
    : `v3-reveal ${className}`.trim()

  return (
    <div
      ref={ref}
      className={cls}
      style={delay && !eager ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
