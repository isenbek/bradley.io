// TEMPORARY — index of generated docs for /junior. Delete at teardown.
//
// Lists the markdown files in docs/junior/. Gated by the same cookie as the
// rest of /junior, so an unauthenticated request gets a 401 and learns nothing
// about what exists.

import { readdir, readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { cookies } from "next/headers"
import { JUNIOR_COOKIE, verifyToken } from "@/lib/junior-session"

export const dynamic = "force-dynamic"

const DOCS_DIR = join(process.cwd(), "docs", "junior")

export type JuniorDoc = {
  slug: string
  title: string
  summary: string
  updated: string
  bytes: number
  mtime: number
}

// Minimal front-matter reader. The docs are ours, so this only needs to handle
// the shape we write: a --- fenced block of key: value lines at the very top.
function frontMatter(src: string): Record<string, string> {
  if (!src.startsWith("---")) return {}
  const end = src.indexOf("\n---", 3)
  if (end === -1) return {}
  const out: Record<string, string> = {}
  for (const line of src.slice(3, end).split("\n")) {
    const i = line.indexOf(":")
    if (i === -1) continue
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

export async function GET() {
  const jar = await cookies()
  if (!verifyToken(jar.get(JUNIOR_COOKIE)?.value)) {
    return new Response(null, { status: 401 })
  }

  let names: string[]
  try {
    names = (await readdir(DOCS_DIR)).filter((n) => n.endsWith(".md"))
  } catch {
    // No docs directory yet is a normal empty state, not an error.
    return Response.json({ docs: [] })
  }

  const docs: JuniorDoc[] = []
  for (const name of names) {
    const path = join(DOCS_DIR, name)
    try {
      const [src, info] = await Promise.all([readFile(path, "utf8"), stat(path)])
      const fm = frontMatter(src)
      const slug = name.replace(/\.md$/, "")
      docs.push({
        slug,
        title: fm.title || slug,
        summary: fm.summary || "",
        updated: fm.updated || "",
        bytes: info.size,
        mtime: info.mtimeMs,
      })
    } catch {
      // A file that vanished mid-listing just doesn't appear.
    }
  }

  docs.sort((a, b) => b.mtime - a.mtime)
  return Response.json({ docs })
}
