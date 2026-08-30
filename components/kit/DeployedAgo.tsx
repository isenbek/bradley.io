"use client"

import { useEffect, useState } from "react"
import { timeAgo } from "@/lib/time-ago"

/**
 * "deployed 12m ago" in the footer, without a hydration mismatch.
 *
 * timeAgo() reads Date.now(), so rendering it during SSR bakes a relative string
 * into HTML that is then cached (these pages serve with s-maxage=3600). The
 * server's copy said "deployed just now" for the entire cache lifetime while
 * every client computed the real elapsed time. That was React error #418 on
 * every page of the site, and a footer that misreported how fresh the deploy
 * was, which is the one thing this line exists to report.
 *
 * A relative time simply cannot be server-rendered: its value depends on when it
 * is read, and the server reads it once. So the first render is the absolute
 * date instead, and the effect upgrades it to the relative form after mount.
 * A post-hydration update is not a mismatch; only a disagreeing first render is.
 *
 * The fallback slices the ISO string rather than formatting a Date, because
 * toLocaleDateString would reintroduce exactly this class of bug: it resolves
 * against the local timezone, and the server and the browser are rarely in the
 * same one.
 *
 * There is deliberately no timer. This reports the build that produced the page
 * being looked at, and a tab left open for an hour is looking at an hour-old
 * page regardless of what the footer says.
 */
export function DeployedAgo({ iso }: { iso: string }) {
  const [ago, setAgo] = useState<string | null>(null)

  useEffect(() => {
    setAgo(timeAgo(iso))
  }, [iso])

  return <time dateTime={iso}>{ago ?? iso.slice(0, 10)}</time>
}
