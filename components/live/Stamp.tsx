import type { ReactNode } from "react"
import { absDateTime, ageWords, toMs } from "@/lib/instrument-status"

/**
 * Stamp: a moment as an absolute UTC time, then what only a browser can add.
 *
 *   As of <Stamp at={data.at} now={now}>. Asks again every 15 s.</Stamp>
 *
 * PROPS
 *   at        ISO string, epoch seconds or epoch ms. Null prints "an unknown time".
 *   now       the browser's clock from useNow(): null on the server and on the
 *             first client render, epoch ms after mount.
 *   children  text that follows the age and is only true in a running browser
 *             (a promise to poll, say). Optional.
 *
 * It prints "2 Oct 2026 17:41 UTC" always, and ", 12 s ago" plus the children
 * once there is a clock.
 *
 * WHY THE TAIL IS RENDERED BEFORE IT IS TRUE. The server cannot print an age,
 * so the line grows after hydration, and on a phone a longer line is one more
 * line: everything under the panel jumps. So the tail is in the server's HTML
 * too, the same words with "--" for the number, invisible and hidden from
 * assistive tech (.beta-live-later). It holds the room the real one will take
 * and wraps where the real one will wrap. A reader without scripts sees the
 * absolute time and nothing after it, which is everything that is true for
 * them. Keep a Stamp last in its line, so the held room is at the end.
 */
export function Stamp({
  at,
  now,
  children,
}: {
  at: number | string | null | undefined
  now: number | null
  children?: ReactNode
}) {
  const ms = toMs(at)
  if (ms == null) return <span>an unknown time</span>
  const held = now === null
  return (
    <>
      <time dateTime={new Date(ms).toISOString()}>{absDateTime(ms)}</time>
      <span className={held ? "beta-live-later" : undefined} aria-hidden={held ? true : undefined}>
        , {held ? "-- s" : ageWords((now - ms) / 1000)} ago
        {children}
      </span>
    </>
  )
}
