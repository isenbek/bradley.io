"use client"

import { useEffect, useRef } from "react"

/**
 * The `matrix` easter egg, back from the original site
 * (git show 63d43d0:components/ui/matrix-rain.tsx).
 *
 * The original covered the whole window with animated columns for five
 * seconds. This one is bounded three ways:
 *
 *   where     it draws inside the CRT's glass and nowhere else
 *   how long  RAIN_MS, then it removes itself; any key or a tap ends it sooner
 *   how hard  one canvas, redrawn about eighteen times a second, device pixel
 *             ratio capped at 2
 *
 * It is never mounted for a reader who asked for reduced motion: the terminal
 * prints MatrixStill instead, which is a few lines of the same glyphs standing
 * still.
 *
 * The colours are read from the monitor's own custom properties at mount, so
 * the rain is whatever phosphor the `theme` command has set.
 */

export const RAIN_MS = 6_000

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789"

const CELL = 16
const FRAME_MS = 55

function glyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
}

export function MatrixRain({ onDone }: { onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const done = useRef(onDone)

  useEffect(() => {
    done.current = onDone
  }, [onDone])

  useEffect(() => {
    const c = canvas.current
    const ctx = c?.getContext("2d")
    if (!c || !ctx) {
      done.current()
      return
    }

    const box = c.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    c.width = Math.max(1, Math.round(box.width * dpr))
    c.height = Math.max(1, Math.round(box.height * dpr))
    ctx.scale(dpr, dpr)

    const style = getComputedStyle(c)
    const fg = style.getPropertyValue("--term-fg").trim() || "currentColor"
    const head = style.getPropertyValue("--term-user").trim() || fg
    const bg = style.getPropertyValue("--term-screen").trim() || "black"

    const cols = Math.max(1, Math.floor(box.width / CELL))
    const rows = Math.ceil(box.height / CELL)
    // Start every column above the glass, at a different height, so the rain
    // arrives ragged instead of as one line.
    const drops = Array.from({ length: cols }, () => -Math.floor(Math.random() * rows))
    // The glyph each column drew last frame, so the white head can be redrawn
    // in the phosphor colour as the column moves on.
    const last = Array.from({ length: cols }, () => "")

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, box.width, box.height)
    ctx.font = `${CELL - 2}px ui-monospace, monospace`
    ctx.textBaseline = "top"

    const started = performance.now()
    let prev = 0
    let raf = 0

    const frame = (t: number) => {
      if (t - started >= RAIN_MS) {
        done.current()
        return
      }
      if (t - prev >= FRAME_MS) {
        prev = t
        ctx.globalAlpha = 0.14
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, box.width, box.height)
        ctx.globalAlpha = 1
        for (let i = 0; i < cols; i++) {
          const y = drops[i]
          if (y > 0 && last[i]) {
            ctx.fillStyle = fg
            ctx.fillText(last[i], i * CELL, (y - 1) * CELL)
          }
          if (y >= 0) {
            last[i] = glyph()
            ctx.fillStyle = head
            ctx.fillText(last[i], i * CELL, y * CELL)
          }
          drops[i] = y > rows && Math.random() > 0.94 ? 0 : y + 1
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvas} className="term__rain" aria-hidden="true" onClick={() => done.current()} />
}

/** The same glyphs, not moving. What `matrix` prints under reduced motion. */
export function matrixStill(width = 13, height = 5): string {
  // Katakana only, and an ideographic space for the gaps: every cell is the
  // same full width, so the columns line up in any monospace fallback.
  const kana = GLYPHS.slice(0, GLYPHS.indexOf("0"))
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () =>
      Math.random() > 0.35 ? kana[Math.floor(Math.random() * kana.length)] : "\u3000",
    ).join(""),
  ).join("\n")
}
