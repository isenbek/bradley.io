"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import buildInfo from "@/lib/build-info.json"
import { Github, Mail, Palette } from "lucide-react"

const themes = [
  {
    id: "deep-sea",
    label: "Deep Sea",
    swatch: ["#0B1215", "#00F5FF", "#7CB8C9"],
  },
  {
    id: "analog-future",
    label: "Analog-Future",
    swatch: ["#1A1A1B", "#FF6B35", "#A3E635"],
  },
  {
    id: "horizon",
    label: "Horizon",
    swatch: ["#FFFFFF", "#2563EB", "#3730A3"],
  },
]

function ThemePicker() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState("deep-sea")

  useEffect(() => {
    const saved = localStorage.getItem("bradley-theme") || "deep-sea"
    setCurrent(saved)
    document.documentElement.setAttribute("data-theme", saved)
  }, [])

  const setTheme = (id: string) => {
    setCurrent(id)
    document.documentElement.setAttribute("data-theme", id)
    localStorage.setItem("bradley-theme", id)
    setOpen(false)
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center hover:opacity-80 transition-opacity"
        style={{ color: "var(--brand-primary)" }}
        title="Switch theme"
      >
        <Palette className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 mb-2 rounded-xl shadow-2xl p-1.5 min-w-[180px] z-50"
              style={{
                background: "var(--brand-bg-alt)",
                border: "1px solid var(--brand-border)",
              }}
            >
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left"
                  style={{
                    background: current === t.id ? "var(--brand-border)" : "transparent",
                    color: "var(--brand-text)",
                  }}
                >
                  <div className="flex gap-0.5 shrink-0">
                    {t.swatch.map((c, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-sm"
                        style={{
                          backgroundColor: c,
                          border: c === "#FFFFFF" ? "1px solid #E2E8F0" : "none",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{t.label}</span>
                  {current === t.id && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--brand-primary)" }}
                    />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function VersionFooter() {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--brand-bg) 85%, transparent)",
        borderTop: "1px solid var(--brand-border)",
      }}
    >
      <div className="container-page flex items-center justify-between h-10 sm:h-11 text-[10px] sm:text-xs font-mono">
        <div className="flex items-center gap-4 sm:gap-5" style={{ color: "var(--brand-muted)" }}>
          <ThemePicker />
          <a
            href="mailto:brad@bradley.io"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{ color: "var(--brand-primary)" }}
          >
            <Mail className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">brad@bradley.io</span>
          </a>
          <a
            href="https://github.com/tinymachines"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <Github className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">tinymachines</span>
          </a>
          <span className="hidden sm:inline">Grand Rapids, MI</span>
        </div>
        <a
          href={`https://github.com/tinymachines/bradley-io/commit/${buildInfo.commitHashFull}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          style={{ color: "var(--brand-muted)" }}
          title={`Branch: ${buildInfo.branch}\nBuilt: ${buildInfo.buildTime}`}
        >
          {buildInfo.version} ({buildInfo.commitHash})
        </a>
      </div>
    </footer>
  )
}
