// TEMPORARY — a standalone, linkable page for one generated doc.
// Delete at teardown along with the rest of /junior.
//
// Exists because the in-page Documents panel sits ~60% down /junior and
// Armando kept missing it. A direct URL you can bookmark or paste into a
// message beats "scroll until you see it".

import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { marked } from "marked"
import { ArrowLeft, Download, Printer } from "lucide-react"
import { JUNIOR_COOKIE, verifyToken } from "@/lib/junior-session"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

const DOCS_DIR = join(process.cwd(), "docs", "junior")

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

function stripFrontMatter(src: string): string {
  if (!src.startsWith("---")) return src
  const end = src.indexOf("\n---", 3)
  return end === -1 ? src : src.slice(end + 4).replace(/^\r?\n/, "")
}

export default async function JuniorDocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const jar = await cookies()
  // Same gate as everything else under /junior. Send them to the PIN form
  // rather than showing a 404 that looks like the doc is gone.
  if (!verifyToken(jar.get(JUNIOR_COOKIE)?.value)) redirect("/junior")

  const { slug } = await params

  // Allow-list against the real directory listing — the slug never becomes
  // part of a path we then hope is safe.
  let names: string[] = []
  try {
    names = (await readdir(DOCS_DIR)).filter((n) => n.endsWith(".md"))
  } catch {
    names = []
  }
  const file = names.find((n) => n === `${slug}.md`)

  if (!file) {
    return (
      <div className="v3-longform v3-jr">
        <header className="v3-page-head">
          <div className="v3-wrap">
            <h1>Document not found</h1>
            <p className="v3-jr-note">
              Nothing here called <code>{slug}</code>.{" "}
              <Link href="/junior">Back to /junior</Link>
            </p>
          </div>
        </header>
      </div>
    )
  }

  const raw = await readFile(join(DOCS_DIR, file), "utf8")
  const fm = frontMatter(raw)
  const html = await marked.parse(stripFrontMatter(raw), { gfm: true })

  return (
    <div className="v3-longform v3-jr">
      <header className="v3-page-head" style={{ paddingBottom: 8 }}>
        <div className="v3-wrap">
          <div className="v3-jr-docnav">
            <Link href="/junior" className="v3-jr-docnav__back">
              <ArrowLeft size={15} strokeWidth={2.4} aria-hidden /> back to /junior
            </Link>
            {/* PDF first: it is the one with page numbers, and printing is a
                real output format here — Armando works from paper next to the
                hardware. Browsers cannot render CSS page counters, so the
                paginated version has to be pre-rendered. */}
            <a
              className="v3-jr-docnav__dl"
              href={`/api/junior/recovery/${slug}.pdf`}
              style={{ marginLeft: "auto" }}
            >
              <Printer size={14} strokeWidth={2.4} aria-hidden /> print (pdf)
            </a>
            <a
              className="v3-jr-docnav__dl"
              href={`/api/junior/docs/${slug}?format=md&download=1`}
              style={{ marginLeft: 0 }}
            >
              <Download size={14} strokeWidth={2.4} aria-hidden /> markdown
            </a>
          </div>
          {(fm.version || fm.updated) && (
            <p className="v3-jr-docnav__meta">
              {[fm.version, fm.updated && `last updated ${fm.updated}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </header>

      <section className="v3-section" style={{ paddingTop: 0 }}>
        <div className="v3-wrap">
          {/* Our own markdown from docs/junior/, never user input. */}
          <article className="v3-md" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>
    </div>
  )
}
