"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Briefcase, User } from "lucide-react"
import { ForgeIcon } from "@/components/ui/ForgeIcon"
import { clsx } from "clsx"
import { AnimatePresence, motion } from "framer-motion"

const navGroups = [
  {
    label: "Work",
    color: "var(--brand-primary)",
    icon: Briefcase,
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
    color: "var(--brand-warning)",
    icon: User,
    items: [
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
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-sf-dark/80 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-sf-dark z-50 lg:hidden shadow-2xl overflow-y-auto border-l"
            style={{ borderColor: "color-mix(in srgb, var(--brand-primary) 25%, transparent)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Close button */}
            <div className="flex justify-end p-2">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-sf-white/10 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-sf-steel" />
              </button>
            </div>

            <div className="px-3 pb-3 space-y-3">
              {/* About — standalone with palette color */}
              <div className="pb-2 border-b" style={{ borderColor: "color-mix(in srgb, var(--brand-info) 30%, transparent)" }}>
                <Link
                  href="/about"
                  onClick={onClose}
                  className={clsx(
                    "block px-3 py-1.5 rounded-lg text-base font-bold transition-colors",
                    pathname === "/about"
                      ? "text-sf-white"
                      : "hover:bg-sf-white/5"
                  )}
                  style={
                    pathname === "/about"
                      ? {
                          color: "var(--brand-info)",
                          background: "color-mix(in srgb, var(--brand-info) 10%, transparent)",
                        }
                      : { color: "var(--brand-info)" }
                  }
                >
                  About
                </Link>
              </div>

              {/* Groups */}
              {navGroups.map((group) => {
                const Icon = group.icon
                return (
                  <div key={group.label}>
                    {/* Group header */}
                    <div
                      className="flex items-center gap-1.5 px-3 pb-1 border-b"
                      style={{ borderColor: `color-mix(in srgb, ${group.color} 40%, transparent)` }}
                    >
                      <div
                        className="flex items-center justify-center w-5 h-5 rounded"
                        style={{
                          background: `color-mix(in srgb, ${group.color} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${group.color} 25%, transparent)`,
                        }}
                      >
                        <Icon className="w-3 h-3" style={{ color: group.color }} />
                      </div>
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: group.color }}
                      >
                        {group.label}
                      </span>
                    </div>

                    {/* Group items */}
                    <div>
                      {group.items.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={clsx(
                              "block px-3 py-1.5 rounded-lg text-base transition-colors border-l-2",
                              isActive
                                ? "font-medium text-sf-white"
                                : "border-transparent text-sf-steel hover:text-sf-white hover:bg-sf-white/5"
                            )}
                            style={
                              isActive
                                ? {
                                    borderColor: group.color,
                                    color: group.color,
                                    background: `color-mix(in srgb, ${group.color} 10%, transparent)`,
                                  }
                                : undefined
                            }
                          >
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
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
              className="lg:hidden p-2 hover:bg-sf-white/10 rounded-lg transition-colors"
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
