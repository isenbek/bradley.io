"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/v3", label: "Home" },
  { href: "/v3/about", label: "About" },
  { href: "/v3/services", label: "Services" },
  { href: "/v3/projects", label: "Projects" },
  { href: "/v3/lab", label: "Lab" },
  { href: "/v3/contact", label: "Contact" },
]

export function V3Nav() {
  const pathname = usePathname() ?? ""

  return (
    <nav className="v3-nav" aria-label="Primary">
      <div className="v3-nav__in">
        <Link href="/v3" className="v3-nav__logo" aria-label="bio·bradley.io home">
          bio<b>·</b>bradley.io
        </Link>
        <div className="v3-nav__links">
          {LINKS.map((l) => {
            const active = l.href === "/v3" ? pathname === "/v3" : pathname.startsWith(l.href)
            return (
              <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            )
          })}
          <Link
            href="/"
            className="v3-nav__back"
            title="Back to the current site"
            aria-label="Back to v1 site"
          >
            ← v1
          </Link>
        </div>
      </div>
    </nav>
  )
}
