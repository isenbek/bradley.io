"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { BioLogo } from "./BioLogo"

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/ai-pilot", label: "Pilot" },
  { href: "/projects", label: "Projects" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
]

export function V3Nav() {
  const pathname = usePathname() ?? ""
  const [open, setOpen] = useState(false)

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = "0"
      document.body.style.right = "0"
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.left = ""
        document.body.style.right = ""
        document.body.style.overflow = ""
        window.scrollTo(0, scrollY)
      }
    }
  }, [open])

  return (
    <>
      <nav className="v3-nav" aria-label="Primary">
        <div className="v3-nav__in">
          <Link href="/" className="v3-nav__logo v3-biologo--bob" aria-label="bio·bradley.io home">
            <BioLogo
              height={28}
              title=""
              bodyColor="var(--v3-blue-500)"
              dotColor="var(--v3-blue-300)"
              bobOnHover
              style={{ marginRight: 4 }}
            />
            <span className="v3-nav__logo-text">bradley.io</span>
          </Link>

          <div className="v3-nav__links">
            {LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  // Nav prefetches 7 routes from every page → 7 RSC fetches
                  // before LCP. Disable to free up the LCP-critical bandwidth.
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </Link>
              )
            })}
          </div>

          <button
            type="button"
            className="v3-nav__burger"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={22} strokeWidth={2.25} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className="v3-drawer"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false)
        }}
      >
        <div className="v3-drawer__panel">
          <div className="v3-drawer__head">
            <Link
              href="/"
              className="v3-nav__logo"
              aria-label="bio·bradley.io home"
              onClick={() => setOpen(false)}
            >
              <BioLogo
                height={28}
                title=""
                bodyColor="var(--v3-blue-500)"
                dotColor="var(--v3-blue-300)"
                style={{ marginRight: 4 }}
              />
              <span className="v3-nav__logo-text">bradley.io</span>
            </Link>
            <button
              type="button"
              className="v3-drawer__close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X size={22} strokeWidth={2.25} />
            </button>
          </div>
          <ul className="v3-drawer__links">
            {LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </>
  )
}
