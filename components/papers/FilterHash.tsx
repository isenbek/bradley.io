"use client"

import { useEffect, useState } from "react"

/**
 * Keeps the domain filter, the address bar and a screen reader in step.
 *
 * The filter itself is a radio group and CSS (block beta-papers-* in
 * app/kit.css) and works with scripts off. This adds the three things CSS
 * cannot:
 *
 * 1. A filtered view that has a URL.
 *      /papers#in-seismology   opens with Seismology selected
 *      /papers#<study slug>    opens on that card, and clears a filter that
 *                              would have hidden it
 *    Choosing a domain rewrites the hash with replaceState, so the back button
 *    leaves the page instead of stepping back through every chip pressed.
 *
 * 2. A way back to the filter from deep in the grid. The bar is meant to stick
 *    under the masthead (position: sticky, kit.css), but on 2026-10-02 it
 *    could not: html and body both carry overflow-x: hidden (globals.css),
 *    which makes body a scroll container that never scrolls, so nothing on
 *    the site sticks, the kit's masthead included. Until that is fixed
 *    sitewide, a small control is fixed above the footer while the filter is
 *    out of sight and the grid is on screen. It names the domain in force and
 *    takes the reader to the chips. It decides by measuring, not by assuming
 *    the bug: the day sticky works, the filter never leaves the window and
 *    the control never appears.
 *
 * 3. A place to land. Choosing a domain shortens the list under the reader;
 *    if the top of the grid has already scrolled away, the window is put back
 *    at it. A jump, never a glide (html has scroll-behavior: smooth, so every
 *    scroll here asks for "instant").
 *
 * 4. The result, said aloud. The visible count line changes by CSS, which a
 *    screen reader does not announce, so the same sentence is written into a
 *    polite status region here.
 */

const JUMP: ScrollIntoViewOptions = { block: "start", behavior: "instant" }

/** The checked chip's name and count, read from its label: "Seismology", "11". */
function current(group: string): { name: string; count: string } | null {
  const radio = document.querySelector<HTMLInputElement>(
    `input[type="radio"][name="${group}"]:checked`
  )
  const label = radio ? document.querySelector(`label[for="${CSS.escape(radio.id)}"]`) : null
  if (!label) return null
  const count = label.querySelector(".beta-papers-filter__n")?.textContent?.trim() ?? ""
  const name = (label.textContent ?? "").replace(count, "").trim()
  return { name, count }
}
/** To the chips, with focus on the one in force, so arrow keys work at once. */
function jumpToFilter(group: string) {
  document.querySelector("[data-papers-browse]")?.scrollIntoView(JUMP)
  document
    .querySelector<HTMLInputElement>(`input[type="radio"][name="${group}"]:checked`)
    ?.focus({ preventScroll: true })
}

export function FilterHash({ group, prefix = "in-" }: { group: string; prefix?: string }) {
  const [said, setSaid] = useState("")
  const [away, setAway] = useState<{ name: string; count: string } | null>(null)

  useEffect(() => {
    const radios = () =>
      Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${group}"]`))

    const fromHash = () => {
      let hash = ""
      try {
        hash = decodeURIComponent(window.location.hash.slice(1))
      } catch {
        return
      }
      if (!hash) return

      if (hash.startsWith(prefix)) {
        const want = hash.slice(prefix.length)
        const radio = radios().find((r) => r.value === want)
        if (radio) {
          radio.checked = true
          radio.closest("[data-papers-browse]")?.scrollIntoView(JUMP)
        }
        return
      }

      const card = document.getElementById(hash)
      if (card?.hasAttribute("data-domain")) {
        const all = radios().find((r) => r.value === "all")
        if (all && !all.checked) all.checked = true
        card.scrollIntoView(JUMP)
      }
    }

    const onChange = (e: Event) => {
      const t = e.target
      if (!(t instanceof HTMLInputElement) || t.name !== group || !t.checked) return
      const { pathname, search } = window.location
      window.history.replaceState(
        null,
        "",
        t.value === "all" ? pathname + search : `${pathname}${search}#${prefix}${t.value}`
      )

      const browse = t.closest("[data-papers-browse]")
      if (!browse) return

      // CSS.escape: the value is a domain id the page has already checked, and
      // this keeps a strange one from breaking the selector all the same.
      const line = browse.querySelector(`[data-showing] [data-for="${CSS.escape(t.value)}"]`)
      setSaid(line?.textContent?.trim() ?? "")

      // Past the top of the grid: go back to it. scroll-margin-top on the
      // container (kit.css) keeps it clear of the masthead.
      if (browse.getBoundingClientRect().top < 0) browse.scrollIntoView(JUMP)
      measure()
    }

    // Is the filter out of sight while the grid is in it? Read on scroll and
    // resize, at most once a frame. The masthead's height comes from the same
    // custom property KitNav sets for the kit.
    let frame = 0
    const measure = () => {
      const filter = document.querySelector(".beta-papers-filter")
      const grid = document.querySelector(".beta-papers-grid")
      if (!filter || !grid) return
      const head =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-head-h")) || 0
      const f = filter.getBoundingClientRect()
      const g = grid.getBoundingClientRect()
      // The control sits low on the right, above the footer. It shows only
      // while the grid still runs under that spot, so it never covers the
      // colophon or whatever follows the grid.
      const foot =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-foot-h")) || 48
      const lost = f.bottom < head && g.bottom > window.innerHeight - foot - 72 && g.top < window.innerHeight
      setAway(lost ? current(group) : null)
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    }

    // The no-script link at the foot of the grid, when it is followed with
    // scripts on after all (a reader who saved the page): the same jump as the
    // control, without writing #papers-filter over a #in-<domain> hash.
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest('a[href="#papers-filter"]') : null
      if (!a) return
      e.preventDefault()
      jumpToFilter(group)
      setAway(null)
    }

    fromHash()
    measure()
    window.addEventListener("hashchange", fromHash)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    document.addEventListener("change", onChange)
    document.addEventListener("click", onClick)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("hashchange", fromHash)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      document.removeEventListener("change", onChange)
      document.removeEventListener("click", onClick)
    }
  }, [group, prefix])

  const backToFilter = () => {
    jumpToFilter(group)
    setAway(null)
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {said}
      </p>
      {away && (
        <button
          type="button"
          className="beta-papers-return"
          onClick={backToFilter}
          aria-label={`Back to the domain filter. Showing ${away.name}, ${away.count} ${away.count === "1" ? "note" : "notes"}.`}
        >
          <span className="beta-papers-return__k">Domain</span>
          <span>{away.name}</span>
          <span className="beta-papers-return__n">{away.count}</span>
          <span aria-hidden="true">{"\u2191"}</span>
        </button>
      )}
    </>
  )
}
