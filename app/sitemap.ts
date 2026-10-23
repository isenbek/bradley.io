import type { MetadataRoute } from "next"
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { listSitePages } from "@/lib/site-pages"

/**
 * Every public page, found by walking app/ rather than typed by hand, so a
 * new route is listed the day it ships. Complete on purpose: tinypeek reads
 * this file as bradley.io's page list (tm://tinymachines/http/bradley.io/,
 * tinymachines/tinypeek#24), only fetches what is listed, and its spec says a
 * collection must be complete. Search engines get the same list.
 *
 * The list itself is lib/site-pages.ts (what is left out, and why), shared
 * with the link manifest at /.well-known/tm-manifest.json.
 *
 * lastmod is real. A page that renders pipeline data the deploy commits
 * (DATA_PAGES) changes with every deploy, so it carries the build time. Every
 * other page carries the date of the last commit to its own files (the files
 * in its folder, not its children's). When git cannot answer, the build time.
 */

const BASE = "https://bradley.io"
const BUILT = new Date()

/** Pages whose content is pipeline output or a live reading, rebuilt each deploy. */
const DATA_PAGES = new Set([
  "/",
  "/bench",
  "/ai-pilot",
  "/walk-ins",
  "/work",
  "/mcp",
  "/papers",
  "/projects",
  "/trng",
  "/dragonfli",
  "/dragonfli/airspace",
  "/dragonfli/gps",
  "/dragonfli/worldevent",
  "/meatball",
  "/fleet",
  "/housecalls",
])

/** Frozen pages: the date they stopped changing. */
const FROZEN: Record<string, Date> = {
  // A case study, window 2025-12-01 to 2026-03-26, frozen 2026-10-02.
  "/cost-analysis": new Date("2026-10-02"),
}

type Freq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>

/** The weights the hand-written list carried; anything unnamed is monthly at 0.5. */
const WEIGHT: Record<string, [Freq, number]> = {
  "/": ["weekly", 1.0],
  "/projects": ["weekly", 0.9],
  "/about": ["monthly", 0.8],
  "/resume": ["monthly", 0.8],
  "/services": ["monthly", 0.8],
  "/work": ["weekly", 0.8],
  "/walk-ins": ["daily", 0.8],
  "/papers": ["weekly", 0.8],
  "/6502": ["monthly", 0.8],
  "/cost-analysis": ["yearly", 0.8],
  "/the-shift": ["monthly", 0.8],
  "/contact": ["monthly", 0.7],
  "/bench": ["daily", 0.7],
  "/ai-pilot": ["daily", 0.7],
  "/mcp": ["weekly", 0.7],
  "/ask": ["monthly", 0.6],
  "/trng": ["daily", 0.6],
  "/dragonfli": ["daily", 0.6],
  "/meatball": ["daily", 0.6],
  "/dragonfli/airspace": ["daily", 0.5],
  "/dragonfli/gps": ["daily", 0.5],
  "/dragonfli/worldevent": ["daily", 0.5],
  "/terminal": ["monthly", 0.5],
}

function lastCommit(files: string[]): Date {
  if (files.length === 0) return BUILT
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...files], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    return out ? new Date(out) : BUILT
  } catch {
    return BUILT
  }
}

/**
 * Sources a page reads that live outside its folder. A page's own
 * components/<first segment>/ folder is counted automatically (/about's words
 * are components/about/content.ts); these are the rest.
 */
const SOURCES: Record<string, string[]> = {
  "/resume": ["lib/resume.ts"],
  "/ask": ["lib/chat"],
  "/6502": ["components/mos"],
}

/** The files directly in a route's folder (not its child routes). */
function ownFiles(dir: string): string[] {
  return readdirSync(dir)
    .map((f) => path.join(dir, f))
    .filter((f) => statSync(f).isFile())
    .map((f) => path.relative(process.cwd(), f))
}

function sourcesOf(route: string, dir: string): string[] {
  const seg = route.split("/")[1]
  const comp = seg ? path.join("components", seg) : ""
  const extra = SOURCES[route] ?? []
  return [...ownFiles(dir), ...(comp && existsSync(comp) ? [comp] : []), ...extra]
}

export default function sitemap(): MetadataRoute.Sitemap {
  return listSitePages().map((p) => {
    const [changeFrequency, priority] = WEIGHT[p.route] ?? ["monthly", 0.5]
    const lastModified =
      FROZEN[p.route] ?? (DATA_PAGES.has(p.route) ? BUILT : lastCommit(sourcesOf(p.route, p.dir)))
    return { url: p.route === "/" ? BASE : `${BASE}${p.route}`, lastModified, changeFrequency, priority }
  })
}
