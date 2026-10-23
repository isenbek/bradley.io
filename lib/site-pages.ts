import { readdirSync } from "node:fs"
import path from "node:path"

/**
 * The site's public page list, found by walking app/. One list, two readers:
 * app/sitemap.ts (search engines and tinypeek) and the link manifest at
 * /.well-known/tm-manifest.json (lib/tm-manifest.ts). The manifest's reader
 * ignores any page the sitemap does not list, so both must come from here.
 *
 * Left out, and why:
 *   - private folders (_x), dynamic segments, api/, preview/ and beta/ (the
 *     vendored kit, no pages);
 *   - pages that are noindex by design: /eyes, /meatball/log,
 *     /meatball/memory, /preferences;
 *   - pages robots.txt disallows: /visitors, /resume/print and the House
 *     Calls paperwork, /housecalls/docs and its docs (app/robots.ts).
 *     tinypeek treats Disallow as its deny list, so keep the two in step.
 */

export const APP = path.join(process.cwd(), "app")

const NOINDEX = new Set(["/eyes", "/meatball/log", "/meatball/memory", "/preferences"])
const DISALLOWED = new Set(["/visitors", "/resume/print", "/housecalls/docs"])
const SKIP_DIRS = new Set(["api", "preview", "beta", "fonts"])

export interface SitePage {
  /** "/" or "/a/b", no trailing slash: the sitemap's path without scheme and host. */
  route: string
  /** The route's folder under app/. */
  dir: string
}

/** Every static route under app/, as "/a/b", with its folder. */
function walk(dir: string, route: string, out: SitePage[]) {
  const entries = readdirSync(dir, { withFileTypes: true })
  if (entries.some((e) => e.isFile() && e.name === "page.tsx")) out.push({ route: route || "/", dir })
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const name = e.name
    if (name.startsWith("_") || name.startsWith("[") || name.startsWith("@") || name.startsWith("."))
      continue
    if (route === "" && SKIP_DIRS.has(name)) continue
    // A route group "(x)" adds no segment.
    const seg = name.startsWith("(") ? "" : `/${name}`
    walk(path.join(dir, name), route + seg, out)
  }
}

/** The public pages, sorted by route. */
export function listSitePages(): SitePage[] {
  const found: SitePage[] = []
  walk(APP, "", found)
  return found
    .filter((p) => !NOINDEX.has(p.route) && !DISALLOWED.has(p.route))
    .sort((a, b) => a.route.localeCompare(b.route))
}
