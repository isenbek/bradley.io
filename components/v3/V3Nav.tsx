"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

  return (
    <nav className="v3-nav" aria-label="Primary">
      <div className="v3-nav__in">
        <Link href="/" className="v3-nav__logo" aria-label="bio·bradley.io home">
          <BioLogo
            height={26}
            title=""
            style={{ color: "var(--v3-blue-500)", marginRight: 4 }}
          />
          <span className="v3-nav__logo-text">bradley.io</span>
        </Link>
        <div className="v3-nav__links">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
            return (
              <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
