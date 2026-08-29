"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV } from "@/app/_nav"
import { BioLogo } from "@/components/v3/BioLogo"

/**
 * The site masthead and its menu.
 *
 * The kit ships no JavaScript by design, so its menu CSS reacts to state that
 * something else has to set. This component is that something else, and the
 * contract is exactly four things:
 *
 *   - `aria-expanded` on .menu-btn, which draws the bars as a cross when open
 *   - `html.menu-open`, which freezes the page so the panel scrolls itself
 *   - `--app-head-h` and `--app-foot-h`, the real measured heights of the fixed
 *     chrome. The kit falls back to 4rem and 3rem, and those are a floor for the
 *     first frame rather than a value: the panel's max-height is derived from
 *     them, so a wrong number means a menu that either scrolls when it did not
 *     need to or runs off the bottom of a phone.
 *   - .menu-scrim, which closes on click at every width
 */
export function KitNav() {
  const pathname = usePathname() ?? ""
  const [open, setOpen] = useState(false)
  const headRef = useRef<HTMLElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Measure the fixed chrome and publish it to the kit. ResizeObserver rather
  // than a resize listener because the header's own height changes when the
  // wordmark wraps, which no window event fires for.
  useEffect(() => {
    const head = headRef.current
    if (!head) return
    const publish = () => {
      document.documentElement.style.setProperty("--app-head-h", `${head.offsetHeight}px`)
      const foot = document.querySelector<HTMLElement>(".beta-root .app-foot")
      if (foot) {
        document.documentElement.style.setProperty("--app-foot-h", `${foot.offsetHeight}px`)
      }
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(head)
    const foot = document.querySelector<HTMLElement>(".beta-root .app-foot")
    if (foot) ro.observe(foot)
    return () => {
      ro.disconnect()
      // Leave nothing behind for v3, which shares this documentElement.
      document.documentElement.style.removeProperty("--app-head-h")
      document.documentElement.style.removeProperty("--app-foot-h")
    }
  }, [])

  // The scroll freeze is the kit's rule; setting the class is ours.
  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add("menu-open")
    return () => document.documentElement.classList.remove("menu-open")
  }, [open])

  // Escape closes, and focus goes back to the control that opened it. Without
  // the second half, dismissing the menu drops the caret at the top of the
  // document and a keyboard user has to tab the whole header again.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  // Close on navigation.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="app-head" ref={headRef}>
      <div className="band topbar">
        {/* The real wordmark in the die, not the letters "BIO".
            Recoloured onto the kit palette: mustard body on the ink tile
            (9.5:1, the same treatment the kit gives its own die text) with the
            i-dot in the accent, which is what the three-piece split in
            lib/bio-logo-path.ts exists for. Nothing here is Bio Blue any more. */}
        <Link className="wordmark" href="/" aria-label="bradley.io home">
          <span className="die die--mark">
            <BioLogo
              height={18}
              title=""
              bodyColor="var(--color-mustard)"
              dotColor="var(--color-accent)"
            />
          </span>
          <b>bradley.io</b>
        </Link>

        <div className="menu-wrap">
          <button
            type="button"
            className="menu-btn"
            ref={btnRef}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Menu
          </button>

          {open && (
            <>
              {/* Before the panel in source order so it never covers it. */}
              <div className="menu-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
              <div className="menu-panel" id="site-menu">
                <div className="menu-sheet">
                  {NAV.map((group) => (
                    <nav className="menu-group" key={group.title} aria-label={group.title}>
                      <h2>{group.title}</h2>
                      {group.links.map((l) => {
                        const current = l.href === pathname
                        return (
                          <Link
                            className="menu-item"
                            key={l.href}
                            href={l.href}
                            aria-current={current ? "page" : undefined}
                          >
                            <b>{l.label}</b>
                            <span>{l.blurb}</span>
                          </Link>
                        )
                      })}
                    </nav>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
