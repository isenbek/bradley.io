import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { marked } from "marked"

/**
 * Server-side reader for docs/housecalls/*.md: the hunt's paperwork,
 * rendered on the hunt's own page (/housecalls/docs). Files are committed
 * markdown with front matter; this parses the front matter by hand (three
 * fields, no need for a dependency) and rewrites relative .md links to
 * their /housecalls/docs/<slug> routes so the folder's internal links
 * keep working on the site.
 *
 * Read at build time (SSG): docs change by commit, and commits deploy.
 */

const DOCS_DIR = path.join(process.cwd(), "docs", "housecalls")

export interface HuntDoc {
  slug: string
  title: string
  status: string
  updated: string | null
  html: string
}

interface FrontMatter {
  title: string
  status: string
  updated: string | null
  body: string
}

function parseFrontMatter(raw: string, slug: string): FrontMatter {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) return { title: slug, status: "", updated: null, body: raw }
  const head = m[1]
  const field = (name: string) => {
    const f = head.match(new RegExp(`^${name}:\\s*"?([^"\\n]*)"?\\s*$`, "m"))
    return f ? f[1].trim() : null
  }
  return {
    title: field("title") ?? slug,
    status: field("status") ?? "",
    updated: field("updated") ?? field("created"),
    body: raw.slice(m[0].length),
  }
}

/** Relative foo.md links become site routes; everything else passes through. */
function rewriteLinks(html: string): string {
  return html.replace(/href="([a-z0-9-]+)\.md"/g, 'href="/housecalls/docs/$1"')
}

export function listDocSlugs(): string[] {
  return readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => f.replace(/\.md$/, ""))
    .sort()
}

export function readDoc(slug: string): HuntDoc | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  let raw: string
  try {
    raw = readFileSync(path.join(DOCS_DIR, `${slug}.md`), "utf8")
  } catch {
    return null
  }
  const fm = parseFrontMatter(raw, slug)
  return {
    slug,
    title: fm.title,
    status: fm.status,
    updated: fm.updated,
    html: rewriteLinks(marked.parse(fm.body, { async: false }) as string),
  }
}

/** The README is the index page's body: it IS the map of the folder. */
export function readIndex(): HuntDoc {
  const raw = readFileSync(path.join(DOCS_DIR, "README.md"), "utf8")
  const fm = parseFrontMatter(raw, "README")
  return {
    slug: "README",
    title: fm.title,
    status: fm.status,
    updated: fm.updated,
    html: rewriteLinks(marked.parse(fm.body, { async: false }) as string),
  }
}
