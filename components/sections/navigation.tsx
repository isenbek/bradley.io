"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Terminal, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeSelector } from "@/components/ui/theme-selector"
import { cn } from "@/lib/utils"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  // Priority navigation for mobile
  const primaryLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/terminal", label: "Terminal", icon: Terminal },
    { href: "/contact", label: "Contact" },
  ]

  // Secondary links for desktop/mobile menu
  const secondaryLinks = [
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/resume", label: "Resume" },
    { href: "/case-studies", label: "Case Studies" },
    { href: "/blog", label: "Blog" },
    { href: "/wargames", label: "WOPR", icon: Terminal },
  ]

  const allLinks = [...primaryLinks, ...secondaryLinks]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Terminal className="h-6 w-6 text-primary" />
          <span className="font-mono font-bold text-xl">bradley.io</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 xl:space-x-6">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  link.icon && "flex items-center gap-1"
                )}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-3 xl:space-x-4">
            <ThemeSelector />
            <Button asChild>
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* Tablet/Mobile Navigation */}
        <div className="flex lg:hidden ml-auto items-center space-x-2">
          <div className="hidden md:flex items-center space-x-3">
            {primaryLinks.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="h-10 w-10"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile/Tablet Menu */}
      {isOpen && (
        <div className="lg:hidden border-t bg-background/95 backdrop-blur">
          <div className="container py-4 space-y-1">
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b md:hidden">
              {primaryLinks.slice(0, 4).map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  asChild
                  className="justify-start h-12"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={link.href} className="flex items-center gap-2">
                    {link.icon && <link.icon className="h-4 w-4" />}
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
            
            {/* All Links */}
            <div className="space-y-1 pt-2">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted hover:text-primary",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="pt-3 border-t space-y-3">
              <ThemeSelector />
              <Button asChild className="w-full h-12">
                <Link href="/contact">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}