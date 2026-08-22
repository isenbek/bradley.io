// Render the recent conversation to a readable, scrollable page.
//
// WHY: Claude Code is a full-screen TUI - it redraws rather than scrolling, so
// there is no scrollback to reach, in tmux or anywhere else. Armando cannot
// scroll back through the terminal and never will be able to. This gives him
// the same content as a normal web page he can scroll, search and print.

import { readFileSync, writeFileSync } from "node:fs"

const SESSION = process.env.SESSION_FILE
const OUT = process.env.OUT || "docs/junior/session-log.md"
const LIMIT = Number(process.env.LIMIT || 60)

if (!SESSION) { console.error("SESSION_FILE not set"); process.exit(1) }

const lines = readFileSync(SESSION, "utf8").split("\n").filter(Boolean)
const turns = []

for (const line of lines) {
  let o
  try { o = JSON.parse(line) } catch { continue }
  const m = o.message
  if (!m || (o.type !== "assistant" && o.type !== "user")) continue

  let text = ""
  if (typeof m.content === "string") text = m.content
  else if (Array.isArray(m.content)) {
    text = m.content.filter(c => c.type === "text").map(c => c.text).join("\n")
  }
  text = (text || "").trim()
  if (!text) continue
  // skip harness noise and tool plumbing
  if (text.startsWith("<") || text.includes("[SYSTEM NOTIFICATION")) continue
  if (text.includes("Caveat: The messages below")) continue

  turns.push({ who: o.type, text, at: o.timestamp || "" })
}

const recent = turns.slice(-LIMIT)
const stamp = new Date().toISOString().replace("T", " ").slice(0, 16)

let md = `---
title: Session Log
summary: Everything said in the shared terminal, as a page you can actually scroll
version: ${stamp}
updated: ${stamp.slice(0, 10)}
---

# Session Log

**Last ${recent.length} messages · refreshed ${stamp} UTC**

> The terminal cannot scroll back — Claude Code redraws the screen instead of
> printing lines that scroll away, so there is no history to reach. This page
> is that history. Scroll it, search it, print it.

---

`

for (const t of recent) {
  const time = t.at ? t.at.slice(11, 16) : ""
  if (t.who === "user") {
    md += `\n### 🗣 You${time ? ` · ${time}` : ""}\n\n${t.text}\n\n---\n`
  } else {
    md += `\n### 🤖 Jr${time ? ` · ${time}` : ""}\n\n${t.text}\n\n---\n`
  }
}

writeFileSync(OUT, md)
console.log(`wrote ${OUT} — ${recent.length} messages`)
