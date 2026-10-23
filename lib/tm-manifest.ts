import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { listSitePages } from "@/lib/site-pages"

/**
 * The link manifest, tm_manifest v1 (tinymachines/tinypeek#9; Brad,
 * 2026-10-23: bradley.io emits it first). Served at
 * /.well-known/tm-manifest.json and built once, at build time.
 *
 * For every page the sitemap lists (lib/site-pages.ts, the same list, keyed
 * the same way):
 *   title    the page's <title> as a person reads it, resolved the way Next
 *            resolves it (pageTitle below), with the site suffix taken off.
 *            tests/tm-manifest.spec.ts holds it to the rendered <title>.
 *   source   its page.tsx and its own layout.tsx or template.tsx, never the
 *            root layout.
 *   reads    tracked data files the page's own code reads, found by following
 *            its local imports (app/, components/, lib/) and collecting the
 *            .json names they mention: a path like "public/data/x.json", or
 *            a bare "x.json" that names a tracked file in public/data/ or
 *            data/. A "/data/x.json" URL is a fetch from the browser, not a
 *            read at render or build, so it goes in x-fetches instead.
 *   x-imports  the other tracked files in that import closure, so a link can
 *            reach the component that draws the page and not only its shell.
 *
 * Every path is checked against `git ls-files`: a file that is not tracked is
 * never named. If git cannot answer (no repo at build), nothing is named and
 * the manifest carries titles only.
 */

const ROOT = process.cwd()
const SITE = "bradley.io"
const REPOSITORY = "isenbek/bradley.io"

function git(args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
  } catch {
    return null
  }
}

const EXT = ["", ".ts", ".tsx", ".js", ".mjs", ".json", "/index.ts", "/index.tsx"]
const FOLLOW = /^(app|components|lib)\//

function resolveImport(spec: string, from: string): string | null {
  let base: string
  if (spec.startsWith("@/")) base = spec.slice(2)
  else if (spec.startsWith(".")) base = path.relative(ROOT, path.resolve(path.dirname(path.join(ROOT, from)), spec))
  else return null
  for (const e of EXT) {
    const f = base + e
    const abs = path.join(ROOT, f)
    if (existsSync(abs) && statSync(abs).isFile()) return f
  }
  return null
}

const IMPORT_RE = /(?:import|export)\s[^"'`]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g
const JSON_RE = /["'`]([A-Za-z0-9_./-]*\.json)["'`]/g

/** The page's local import closure, its files first. */
function closure(start: string[]): string[] {
  const seen = new Set<string>()
  const queue = [...start]
  while (queue.length) {
    const f = queue.shift()!
    if (seen.has(f)) continue
    seen.add(f)
    if (!/\.(tsx?|m?js)$/.test(f)) continue
    const src = readFileSync(path.join(ROOT, f), "utf8")
    for (const m of src.matchAll(IMPORT_RE)) {
      const r = resolveImport(m[1] ?? m[2], f)
      if (r && FOLLOW.test(r) && !seen.has(r)) queue.push(r)
    }
  }
  return [...seen]
}

function dataRefs(files: string[], tracked: Set<string>) {
  const reads = new Set<string>()
  const fetches = new Set<string>()
  for (const f of files) {
    if (f.endsWith(".json")) {
      if (tracked.has(f)) reads.add(f)
      continue
    }
    const src = readFileSync(path.join(ROOT, f), "utf8")
    for (const m of src.matchAll(JSON_RE)) {
      const name = m[1]
      if (name.startsWith("/data/")) {
        const t = `public${name}`
        if (tracked.has(t)) fetches.add(t)
      } else if (name.includes("/")) {
        const t = name.replace(/^\.?\//, "")
        if (tracked.has(t)) reads.add(t)
      } else {
        for (const t of [`public/data/${name}`, `data/${name}`]) if (tracked.has(t)) reads.add(t)
      }
    }
  }
  return { reads: [...reads].sort(), fetches: [...fetches].sort() }
}

const SUFFIX = /\s*(?:[·|]\s*(?:bio·)?bradley\.io|\|\s*Bradley Isenbek)\s*$/

/** The value of `const NAME = "..."` in the file, or null. */
function constString(src: string, name: string): string | null {
  const m = new RegExp(`const\\s+${name}\\s*(?::\\s*string\\s*)?=\\s*(["'\`])((?:(?!\\1).)*)\\1`).exec(src)
  return m ? m[2] : null
}

/**
 * The page-level title in the file's metadata export, or null. The first
 * `title:` after the export is the top-level one (openGraph and twitter come
 * after it in every file here). It may be a string, a const, or a template
 * built from consts; `{ absolute: ... }` and `{ default: ... }` are read too.
 */
function metadataTitle(file: string): string | null {
  const abs = path.join(ROOT, file)
  if (!existsSync(abs)) return null
  const src = readFileSync(abs, "utf8")
  const at = src.search(/export\s+const\s+metadata\b/)
  if (at < 0) return null
  const m = /\btitle:\s*(?:\{\s*(?:absolute|default):\s*)?(?:(["'])((?:(?!\1).)+)\1|`([^`]+)`|([A-Z_a-z][\w]*))/.exec(
    src.slice(at),
  )
  if (!m) return null
  let t: string | null
  if (m[2] !== undefined) t = m[2]
  else if (m[3] !== undefined) {
    let ok = true
    t = m[3].replace(/\$\{(\w+)\}/g, (_, n: string) => constString(src, n) ?? ((ok = false), ""))
    if (!ok) t = null
  } else t = constString(src, m[4])
  return t ? t.replace(SUFFIX, "").trim() : null
}

/**
 * A page's title the way Next resolves it: its own page.tsx, then each
 * layout from its own folder up to (not including) the root, then the root
 * default. The root template only adds the suffix the manifest drops.
 */
function pageTitle(rel: string): string {
  const own = metadataTitle(path.join(rel, "page.tsx"))
  if (own) return own
  for (let d = rel; d !== "app" && d.startsWith("app"); d = path.dirname(d)) {
    const t = metadataTitle(path.join(d, "layout.tsx"))
    if (t) return t
  }
  return metadataTitle("app/layout.tsx") ?? SITE
}

export interface TmManifestPage {
  title?: string
  source?: string[]
  reads?: string[]
  "x-fetches"?: string[]
  "x-imports"?: string[]
}

export interface TmManifest {
  tm_manifest: 1
  site: string
  repository: string
  commit?: string
  pages: Record<string, TmManifestPage>
}

export function buildTmManifest(): TmManifest {
  const ls = git(["ls-files"])
  const tracked = new Set(ls ? ls.split("\n").filter(Boolean) : [])
  const commit = git(["rev-parse", "HEAD"])?.trim()

  const pages: Record<string, TmManifestPage> = {}
  for (const p of listSitePages()) {
    const rel = path.relative(ROOT, p.dir)
    // The root's layout and template are the shared frame, never a source.
    const own = (rel === "app" ? ["page.tsx"] : ["layout.tsx", "template.tsx", "page.tsx"])
      .map((f) => path.join(rel, f))
      .filter((f) => existsSync(path.join(ROOT, f)))
    const title = pageTitle(rel)

    const entry: TmManifestPage = {}
    if (title) entry.title = title
    const source = own.filter((f) => tracked.has(f))
    if (source.length) entry.source = source
    if (tracked.size) {
      const files = closure(own)
      const { reads, fetches } = dataRefs(files, tracked)
      if (reads.length) entry.reads = reads
      if (fetches.length) entry["x-fetches"] = fetches
      const imports = files.filter((f) => !own.includes(f) && !f.endsWith(".json") && tracked.has(f)).sort()
      if (imports.length) entry["x-imports"] = imports
    }
    pages[p.route] = entry
  }

  return {
    tm_manifest: 1,
    site: SITE,
    repository: REPOSITORY,
    ...(commit && /^[0-9a-f]{40}$/.test(commit) ? { commit } : {}),
    pages,
  }
}
