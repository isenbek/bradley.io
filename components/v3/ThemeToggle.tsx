"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

// Light/dark toggle. The actual theme is set pre-paint by an inline script in
// <head> (no flash); this just reflects + flips it, persisting the choice.
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null)

  useEffect(() => {
    const t = document.documentElement.dataset.theme
    setTheme(t === "dark" ? "dark" : "light")
  }, [])

  function flip() {
    const next = theme === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem("bio-theme", next)
    } catch {
      /* ignore */
    }
    setTheme(next)
  }

  // Render a stable placeholder until mounted so SSR/CSR markup matches.
  const isDark = theme === "dark"
  return (
    <button
      type="button"
      className="v3-theme-toggle"
      onClick={flip}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      suppressHydrationWarning
    >
      {theme === null ? (
        <span className="v3-theme-toggle__ph" aria-hidden />
      ) : isDark ? (
        <Sun size={16} strokeWidth={2.2} />
      ) : (
        <Moon size={16} strokeWidth={2.2} />
      )}
    </button>
  )
}
