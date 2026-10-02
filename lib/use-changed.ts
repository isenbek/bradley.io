"use client"

import { useEffect, useRef, useState } from "react"

/**
 * useChanged: true for a moment after a value differs from the one before it.
 *
 *   const changed = useChanged(row.value)
 *   <span className={changed ? "changed beta-live-settle" : undefined}>{row.value}</span>
 *
 * PROPS
 *   value    anything comparable with Object.is. Pass the DISPLAYED value (the
 *            formatted string), so two readings that print the same do not
 *            count as a change.
 *   holdMs   how long the answer stays true. Default 900. The kit's settle
 *            wash runs for --t-detent (150 ms) and then the value keeps its
 *            "changed" colour for the rest of the hold.
 *
 * RETURNS
 *   boolean. False on the first paint, always: a value that has only just
 *   arrived has not changed, it has appeared. False again when a value goes
 *   from nothing (null or undefined) to something, for the same reason: an
 *   instrument's first answer is not a change in its reading.
 *
 * WHY IT EXISTS. Motion on this site has to carry information, and the only
 * information a flash can carry is "this number is not the one you were
 * looking at a moment ago". So it fires on inequality and on nothing else: not
 * on mount, not on every poll, not on a re-render. A quiet instrument stays
 * quiet. With prefers-reduced-motion the animation collapses (the kit does
 * that globally) and the hook still returns true, so the colour change alone
 * marks the new value.
 */
export function useChanged<T>(value: T, holdMs = 900): boolean {
  const previous = useRef<T>(value)
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    const before = previous.current
    if (Object.is(before, value)) return
    previous.current = value
    // Something where there was nothing is an arrival, not a change.
    if (before == null) return

    setChanged(true)
    const id = setTimeout(() => setChanged(false), holdMs)
    return () => clearTimeout(id)
  }, [value, holdMs])

  return changed
}
