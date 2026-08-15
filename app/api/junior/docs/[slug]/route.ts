// TEMPORARY — serve one generated doc for /junior. Delete at teardown.
//
//   ?format=html  rendered (default, marked stays server-side so it never
//                 ships to the browser)
//   ?format=md    raw markdown
//   ?download=1   force a file download instead of inline display
//
// The slug is matched against the actual directory listing rather than being
// used to build a path — that makes traversal (../../etc/shadow) structurally
// impossible rather than merely filtered.

import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { cookies } from "next/headers"
import { marked } from "marked"
import { JUNIOR_COOKIE, verifyToken } from "@/lib/junior-session"

export const dynamic = "force-dynamic"

const DOCS_DIR = join(process.cwd(), "docs", "junior")

function stripFrontMatter(src: string): string {
  if (!src.startsWith("---")) return src
  const end = src.indexOf("\n---", 3)
  return end === -1 ? src : src.slice(end + 4).replace(/^\r?\n/, "")
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const jar = await cookies()
  if (!verifyToken(jar.get(JUNIOR_COOKIE)?.value)) {
    return new Response(null, { status: 401 })
  }

  const { slug } = await params
  const url = new URL(req.url)
  const format = url.searchParams.get("format") ?? "html"
  const download = url.searchParams.get("download") === "1"

  // Allow-list by listing the directory — never concatenate user input into a
  // path and hope the sanitiser held.
  let names: string[]
  try {
    names = (await readdir(DOCS_DIR)).filter((n) => n.endsWith(".md"))
  } catch {
    return new Response("no docs", { status: 404 })
  }
  const file = names.find((n) => n === `${slug}.md`)
  if (!file) return new Response("not found", { status: 404 })

  const raw = await readFile(join(DOCS_DIR, file), "utf8")
  const body = stripFrontMatter(raw)

  if (format === "md") {
    return new Response(raw, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
        ...(download
          ? { "Content-Disposition": `attachment; filename="${file}"` }
          : {}),
      },
    })
  }

  const html = await marked.parse(body, { gfm: true, breaks: false })
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
