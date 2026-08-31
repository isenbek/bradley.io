import type { ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  /** Kept for API compatibility with the callers; no longer does anything. */
  delay?: number
  className?: string
}

/**
 * A section wrapper for the MDX components.
 *
 * It used to slide its children up 20px on scroll via framer-motion, and it was
 * the only thing in the built tree importing that library. A 20px translate on
 * arrival is not worth a runtime animation dependency, so the animation went and
 * the library went with it. The `delay` prop stays in the signature because six
 * callers pass it; it is inert.
 *
 * No longer a client component either, since the effect was its only reason to
 * be one.
 */
export function AnimatedSection({ children, className }: AnimatedSectionProps) {
  return <div className={className}>{children}</div>
}
