"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV, PRIMARY_LINKS, inSection } from "@/app/_nav"
import { BioLogo } from "@/components/kit/BioLogo"
import { SearchPill } from "@/components/search/SearchPill"

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
 *
 * On a wide screen the bar also carries the primary row: the six links a
 * visitor asks for first, inline, with the section they are standing in
 * marked. That row is bradley.io's own (.beta-nav-primary in app/kit.css) and
 * is display: none below its breakpoint, so on a phone the bar is what it
 * always was, the mark and the MENU button, and the hidden links are out of
 * the focus order too. The row sits inside the bar's one line and is no taller
 * than the button beside it, so it does not move --app-head-h.
 *
 * The mark and the row stay live while the menu is open (they sit one step
 * above the scrim on a wide screen), so each of them closes the menu itself:
 * the close-on-navigation effect below never fires for a link to the page you
 * are already on.
 *
 * The mark in the die is the wordmark itself (components/kit/BioLogo.tsx):
 * one mass in the kit's paper on bradley.io's Steel tile, the i-dot the same
 * paper as the rest. Until 2026-10-06 the dot was the site's live dot (a
 * tinted disc, ACTIVE blue in a paper rim while a Claude Code session was
 * active); at 18px that read as a grainy, bordered dot floating over the i,
 * so the owner retired it. The home page's own LiveDot still carries the
 * live fact; the masthead says nothing about it.
 */

/**
 * What a link says about where the reader is: "page" on the page itself,
 * "true" on a page underneath it (/projects/prime-zoo is in Projects without
 * being Projects), nothing otherwise. The row and the sheet both ask this, so
 * they cannot disagree about where you are.
 */
function currentFor(pathname: string, href: string): "page" | "true" | undefined {
  if (href === pathname) return "page"
  return inSection(pathname, href) ? "true" : undefined
}

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
        {/* The real wordmark in the die, not the letters "BIO". In Steel,
            bradley.io's family hue (2026-10-04): paper on a Steel tile (the
            tile colour is .die--mark in app/kit.css), the same two colours
            as the favicon. The whole mark, dot included, is one paper mass. */}
        <Link
          className="wordmark beta-nav-mark"
          href="/"
          aria-label="bradley.io home"
          onClick={() => setOpen(false)}
        >
          <span className="die die--mark">
            <BioLogo
              height={18}
              title=""
              className="beta-shell-mark"
              bodyColor="var(--color-paper)"
              bobOnHover
            />
          </span>
          <b>bradley.io</b>
        </Link>

        {/* The primary row. Before the menu in source order, so the tab order
            is skip link, mark, these six, then MENU and whatever it opened.
            aria-current is "page" or "true" (see currentFor), and the CSS
            marks both the same way. */}
        <nav className="beta-nav-primary" aria-label="Primary">
          {PRIMARY_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              // Six links in view on every page is six route fetches before
              // anything was asked for. The previous site measured that
              // against first paint and turned it off; same call here.
              prefetch={false}
              aria-current={currentFor(pathname, l.href)}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* The menu is a disclosure, not a dialog: nothing traps focus in it.
            So when focus walks out of it (Tab past the last entry, Shift+Tab
            back off the button) it closes, instead of leaving a card open
            over a page the keyboard is now moving around underneath. Only
            when focus went somewhere: a click on the scrim has no
            relatedTarget and is the scrim's own business, and so is the
            window losing focus. */}
        <SearchPill />

        <div
          className="menu-wrap"
          onBlur={(e) => {
            const next = e.relatedTarget
            if (next instanceof Node && !e.currentTarget.contains(next)) setOpen(false)
          }}
        >
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
                      {group.links.map((l) => (
                        <Link
                          className="menu-item"
                          key={l.href}
                          href={l.href}
                          aria-current={currentFor(pathname, l.href)}
                        >
                          <b>{l.label}</b>
                          <span>{l.blurb}</span>
                        </Link>
                      ))}
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
