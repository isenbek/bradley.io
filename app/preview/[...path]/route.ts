import { promises as fs } from "fs"
import path from "path"

// Client previews: static sites dropped into previews/<slug>/ and shown at
// /preview/<slug>. The directory is gitignored on purpose. This repo is
// public and a client's draft is not ours to publish, so a preview lives on
// this box only and never rides a deploy commit. Unlisted: no nav entry, no
// sitemap entry, Disallow in robots.ts, noindex on every response.
//
// /preview/<slug> redirects to /preview/<slug>/index.html rather than serving
// the page in place: the site sets trailingSlash false, so a page served at
// the bare slug would resolve "covers/book1.jpg" one directory too high.
const ROOT = path.resolve(process.env.PREVIEW_DIR || path.join(process.cwd(), "previews"))

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
}

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const gone = () =>
  new Response("no such preview", { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow" } })

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params
  if (!parts.length || !parts.every((p) => SEGMENT.test(p))) return gone()

  const file = path.join(ROOT, ...parts)
  if (!file.startsWith(ROOT + path.sep)) return gone()

  try {
    // realpath, so a symlink inside a preview cannot point out of ROOT
    const real = await fs.realpath(file)
    if (!real.startsWith(ROOT + path.sep)) return gone()
    const st = await fs.stat(real)

    if (st.isDirectory()) {
      await fs.access(path.join(real, "index.html"))
      return new Response(null, {
        status: 307,
        headers: {
          Location: new URL(`/preview/${parts.join("/")}/index.html`, req.url).pathname,
          "X-Robots-Tag": "noindex, nofollow",
        },
      })
    }

    const type = TYPES[path.extname(real).toLowerCase()]
    if (!type) return gone()
    const buf = await fs.readFile(real)
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        // short, so an updated draft shows on the client's next reload
        "Cache-Control": "private, max-age=60",
        "Last-Modified": st.mtime.toUTCString(),
        "X-Robots-Tag": "noindex, nofollow",
      },
    })
  } catch {
    return gone()
  }
}
