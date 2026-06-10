/**
 * URL inventory for the site audit.
 *
 * - CORE = static + mission timelines + a sample of project dossiers.
 *   Default for fast feedback (~22 URLs × 3 viewports = 66 runs).
 * - ALL  = pulled live from /sitemap.xml at process start.
 *   Use AUDIT_SCOPE=all to run the full sweep (~105 URLs × 3 = 315 runs).
 */
import { execSync } from "child_process"

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:32221"

export const CORE_PATHS: string[] = [
  "/",
  "/about",
  "/contact",
  "/services",
  "/projects",
  "/lab",
  "/ai-pilot",
  "/mcp",
  "/papers",
  "/cost-analysis",
  "/the-shift",
  "/terminal",
  "/trng",
  "/dragonfli",
  "/sdr",
  // Mission timelines
  "/projects/nominate-ai",
  "/projects/tinymachines",
  "/projects/sysforge-ai",
  "/projects/isenbek",
  // A couple of project dossiers
  "/projects/bradleyio",
  "/projects/terrapulse",
]

function fetchSitemapPaths(): string[] {
  try {
    const xml = execSync(`curl -fsS ${BASE_URL}/sitemap.xml`, {
      encoding: "utf-8",
      timeout: 8000,
    })
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1])
    if (urls.length === 0) return CORE_PATHS
    return urls.map((u) => {
      try {
        const parsed = new URL(u)
        return parsed.pathname + (parsed.search || "")
      } catch {
        return u
      }
    }).map((p) => p.replace(/^https?:\/\/[^/]+/, ""))
      .map((p) => (p.startsWith("/") ? p : "/" + p))
      .filter((p, i, a) => a.indexOf(p) === i)
      .sort()
  } catch (err) {
    console.warn(`[urls] sitemap fetch failed, falling back to CORE_PATHS:`, err)
    return CORE_PATHS
  }
}

const SCOPE = (process.env.AUDIT_SCOPE ?? "core").toLowerCase()

export const PATHS: string[] =
  SCOPE === "all"
    ? fetchSitemapPaths()
    : SCOPE === "core"
    ? CORE_PATHS
    : SCOPE.split(",").map((p) => (p.startsWith("/") ? p : "/" + p))

/** Stable slug used for screenshot filenames. */
export function slugFor(path: string): string {
  const cleaned = path.replace(/^\//, "").replace(/\/$/, "")
  if (cleaned === "") return "home"
  return cleaned.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
}
