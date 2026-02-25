"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { ForgeIcon } from "@/components/ui/ForgeIcon"
import { clsx } from "clsx"
import { AnimatePresence, motion } from "framer-motion"

const groupColors: Record<string, string> = {
  Work: "var(--brand-primary)",
  Profile: "var(--brand-secondary)",
}

const navGroups = [
  {
    label: "Work",
    items: [
      { href: "/projects", label: "Projects" },
      { href: "/services", label: "Services" },
      { href: "/ai-pilot", label: "AI Pilot" },
      { href: "/lab", label: "Lab" },
      { href: "/mcp", label: "MCP Catalog" },
    ],
  },
  {
    label: "Profile",
    items: [
      { href: "/about", label: "About" },
      { href: "/style-guide", label: "Style Guide" },
      { href: "/terminal", label: "Terminal" },
      { href: "/wargames", label: "Wargames" },
    ],
  },
]

const topLevelLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/services", label: "Services" },
  { href: "/ai-pilot", label: "AI Pilot" },
  { href: "/lab", label: "Lab" },
  { href: "/mcp", label: "MCP" },
  { href: "/about", label: "About" },
  { href: "/wargames", label: "Wargames" },
]

function MobileDrawer({
  isOpen,
  onClose,
  pathname,
}: {
  isOpen: boolean
  onClose: () => void
  pathname: string
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-sf-dark-alt z-50 lg:hidden shadow-2xl overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-sf-steel/15 bg-sf-dark">
              <span className="font-display font-bold text-sf-white">Navigation</span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-sf-white/10 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-sf-white" />
              </button>
            </div>
            <div className="py-2">
              {/* Home link */}
              <Link
                href="/"
                onClick={onClose}
                className={clsx(
                  "block px-4 py-3 text-sm transition-colors border-l-2",
                  pathname === "/"
                    ? "border-sf-orange text-sf-orange bg-sf-orange/10 font-medium"
                    : "border-transparent text-sf-steel hover:text-sf-white hover:bg-sf-white/5"
                )}
              >
                Home
              </Link>
              {navGroups.map((group) => (
                <div key={group.label}>
                  <div
                    className="px-4 pt-4 pb-1 text-xs font-bold uppercase tracking-wider"
                    style={{ color: groupColors[group.label] }}
                  >
                    {group.label}
                  </div>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "block px-6 py-2.5 text-sm transition-colors border-l-2",
                        pathname === item.href
                          ? "bg-sf-orange/10 border-sf-orange text-sf-orange font-medium"
                          : "border-transparent text-sf-steel hover:text-sf-white hover:bg-sf-white/5"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <header
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-sf-dark/95 backdrop-blur-2xl border-b border-sf-steel/15"
            : "bg-transparent"
        )}
      >
        <nav className="container-page">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 text-sf-white">
              <ForgeIcon size={36} />
              <span className="text-xl font-bold tracking-tight">
                bradley<span style={{ color: "var(--brand-primary)" }} className="font-normal">.io</span>
              </span>
            </Link>

            {/* Desktop nav — flat links */}
            <div className="hidden lg:flex items-center gap-1">
              {topLevelLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "px-3 py-2 text-sm font-medium transition-colors rounded-md",
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? "text-sf-white"
                      : "text-sf-steel hover:text-sf-white"
                  )}
                  style={
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? { background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)" }
                      : undefined
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <button
              className="lg:hidden p-2 text-sf-white hover:bg-sf-white/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Image src="/images/hamburger.svg" alt="Menu" width={28} height={28} className="invert" />
            </button>
          </div>
        </nav>
      </header>

      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        pathname={pathname}
      />
    </>
  )
}
