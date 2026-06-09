"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Folder, Cpu, GitBranch, User } from "lucide-react"
import { ForgeIcon } from "@/components/ui/ForgeIcon"
import { clsx } from "clsx"
import { AnimatePresence, motion } from "framer-motion"

const navGroups = [
  {
    label: "Projects",
    color: "var(--brand-primary)",
    icon: Folder,
    items: [
      { href: "/projects", label: "All Projects" },
      { href: "/lab", label: "Lab" },
    ],
  },
  {
    label: "Timelines",
    color: "var(--brand-secondary)",
    icon: GitBranch,
    items: [
      { href: "/projects/nominate-ai", label: "Nominate-AI" },
      { href: "/projects/tinymachines", label: "tinymachines" },
      { href: "/projects/sysforge-ai", label: "Sysforge-AI" },
      { href: "/projects/isenbek", label: "isenbek" },
    ],
  },
  {
    label: "Tools",
    color: "var(--brand-info)",
    icon: Cpu,
    items: [
      { href: "/ai-pilot", label: "AI Pilot" },
      { href: "/mcp", label: "MCP Catalog" },
      { href: "/papers", label: "Papers" },
      { href: "/cost-analysis", label: "Cost Analysis" },
    ],
  },
  {
    label: "Profile",
    color: "var(--brand-warning)",
    icon: User,
    items: [
      { href: "/about", label: "About" },
      { href: "/services", label: "Services" },
      { href: "/style-guide", label: "Style Guide" },
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
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "color-mix(in srgb, var(--brand-bg) 90%, transparent)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 lg:hidden flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: "var(--brand-bg-alt)",
                border: "1px solid var(--brand-border)",
              }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--brand-border)" }}
              >
                <div className="flex items-center gap-2.5">
                  <ForgeIcon size={24} />
                  <span className="text-sm font-bold tracking-tight">
                    bradley<span style={{ color: "var(--brand-primary)" }} className="font-normal">.io</span>
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--brand-muted)" }}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* v3 preview banner */}
              <Link
                href="/v3"
                onClick={onClose}
                className="v3-banner relative block px-5 py-4 text-center overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #29BFF4 0%, #13B8F3 45%, #08749B 100%)",
                  color: "#FFFFFF",
                  borderBottom: "1px solid var(--brand-border)",
                  boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.18)",
                }}
              >
                <span
                  aria-hidden
                  className="v3-banner__sheen"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%)",
                    backgroundSize: "220% 100%",
                    animation: "v3BannerSheen 3.6s linear infinite",
                    pointerEvents: "none",
                  }}
                />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
                    position: "relative",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      fontSize: "1.1em",
                      animation: "v3ToggleTwinkle 1.8s ease-in-out infinite",
                    }}
                  >
                    ✦
                  </span>
                  Try v3
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      background: "rgba(255, 255, 255, 0.95)",
                      color: "#08749B",
                      borderRadius: 999,
                      fontWeight: 800,
                    }}
                  >
                    NEW
                  </span>
                </span>
                <div
                  style={{
                    fontSize: 11,
                    marginTop: 4,
                    opacity: 0.9,
                    letterSpacing: "0.04em",
                    fontWeight: 600,
                    position: "relative",
                  }}
                >
                  preview the new design →
                </div>
              </Link>
              <style jsx>{`
                @keyframes v3BannerSheen {
                  0% {
                    background-position: 220% 0;
                  }
                  100% {
                    background-position: -120% 0;
                  }
                }
                @keyframes v3ToggleTwinkle {
                  0%,
                  100% {
                    transform: rotate(0deg) scale(1);
                  }
                  50% {
                    transform: rotate(180deg) scale(1.18);
                  }
                }
                @media (prefers-reduced-motion: reduce) {
                  .v3-banner__sheen,
                  .v3-banner span[aria-hidden] {
                    animation: none !important;
                  }
                }
              `}</style>

              {/* Nav groups grid */}
              <div className="grid grid-cols-2 gap-px" style={{ background: "var(--brand-border)" }}>
                {navGroups.map((group) => {
                  const Icon = group.icon
                  return (
                    <div
                      key={group.label}
                      className="p-4"
                      style={{ background: "var(--brand-bg-alt)" }}
                    >
                      <div className="flex items-center gap-1.5 mb-3">
                        <Icon className="w-3.5 h-3.5" style={{ color: group.color }} />
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: group.color }}
                        >
                          {group.label}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={onClose}
                              className={clsx(
                                "block px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                                isActive
                                  ? "font-medium"
                                  : "hover:bg-sf-white/5"
                              )}
                              style={
                                isActive
                                  ? {
                                      color: group.color,
                                      background: `color-mix(in srgb, ${group.color} 10%, transparent)`,
                                    }
                                  : { color: "var(--brand-text)" }
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
              <Link
                href="/v3"
                title="Preview the new design"
                className="v3-toggle ml-3 relative px-4 py-2 text-sm font-mono font-extrabold uppercase tracking-[0.18em] rounded-full transition-all whitespace-nowrap inline-flex items-center gap-2 group"
                style={{
                  background: "linear-gradient(135deg, #29BFF4 0%, #13B8F3 50%, #0A96C7 100%)",
                  color: "#FFFFFF",
                  boxShadow:
                    "0 0 0 2px rgba(19, 184, 243, 0.18), 0 8px 28px -8px rgba(19, 184, 243, 0.75), 0 0 24px rgba(19, 184, 243, 0.35)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                }}
              >
                <span
                  className="v3-toggle__halo"
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "9999px",
                    background:
                      "linear-gradient(135deg, #29BFF4, #13B8F3, #0A96C7)",
                    opacity: 0.45,
                    filter: "blur(8px)",
                    zIndex: -1,
                    animation: "v3TogglePulse 2.4s ease-in-out infinite",
                  }}
                />
                <span
                  aria-hidden
                  style={{
                    fontSize: "1.05em",
                    animation: "v3ToggleTwinkle 1.8s ease-in-out infinite",
                  }}
                >
                  ✦
                </span>
                <span>Try v3</span>
                <span
                  aria-hidden
                  style={{
                    fontSize: "9px",
                    padding: "1px 6px",
                    background: "rgba(255, 255, 255, 0.95)",
                    color: "#08749B",
                    borderRadius: 999,
                    letterSpacing: "0.12em",
                    fontWeight: 800,
                    boxShadow: "0 1px 0 rgba(0, 0, 0, 0.08)",
                  }}
                >
                  NEW
                </span>
              </Link>
              <style jsx>{`
                .v3-toggle:hover {
                  transform: translateY(-1px) scale(1.04);
                }
                .v3-toggle:hover .v3-toggle__halo {
                  opacity: 0.7;
                }
                @keyframes v3TogglePulse {
                  0%,
                  100% {
                    opacity: 0.4;
                    transform: scale(1);
                  }
                  50% {
                    opacity: 0.75;
                    transform: scale(1.06);
                  }
                }
                @keyframes v3ToggleTwinkle {
                  0%,
                  100% {
                    transform: rotate(0deg) scale(1);
                    opacity: 1;
                  }
                  50% {
                    transform: rotate(180deg) scale(1.18);
                    opacity: 0.85;
                  }
                }
                @media (prefers-reduced-motion: reduce) {
                  .v3-toggle__halo,
                  .v3-toggle span[aria-hidden] {
                    animation: none !important;
                  }
                }
              `}</style>
            </div>

            <button
              className="lg:hidden p-2 hover:bg-sf-white/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Image src="/images/hamburger.svg" alt="Menu" width={28} height={28} style={{ filter: "var(--hamburger-filter, invert(1))" }} />
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
