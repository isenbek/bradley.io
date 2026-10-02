#!/usr/bin/env node
/**
 * build-resume-pdf.mjs: print /resume/print to public/resume.pdf.
 *
 * WHY
 *   The PDF used to be a hand-made copy, and it drifted from /resume the day
 *   the page was edited. Now both come from lib/resume.ts: /resume renders it
 *   for the screen, /resume/print renders it as a US Letter sheet, and this
 *   script prints that sheet. Change the data, rerun this, commit the PDF.
 *
 * RUN
 *   export PATH="$HOME/.nvm/versions/node/v24.0.1/bin:$HOME/.bun/bin:$PATH"
 *   node scripts/build-resume-pdf.mjs                    # against the live service
 *   RESUME_BASE_URL=http://127.0.0.1:32290 node scripts/build-resume-pdf.mjs
 *
 *   The base URL must serve the CURRENT code. The live service (:32221, the
 *   default) serves what was last deployed, so after editing lib/resume.ts
 *   either deploy first and then run this, or point it at a dev or preview
 *   server running the working tree. If the server is behind the data, the
 *   script says so and refuses (it reads lib/resume.ts from disk and checks
 *   every printed line against it). Then commit public/resume.pdf by hand:
 *   deploy.sh stages public/, but only on its own run.
 *
 * ENVIRONMENT
 *   RESUME_BASE_URL  where the site is served   (default http://127.0.0.1:32221)
 *   RESUME_PDF_OUT   where to write the PDF     (default public/resume.pdf)
 *   CHROME_PATH      the browser to print with  (default /opt/google/chrome/chrome)
 *
 * WHAT IT REFUSES TO WRITE
 *   Anything it cannot vouch for. It exits non-zero and leaves the old PDF in
 *   place if: the page is not a 200; the sheet is missing; the site's fonts
 *   did not load (the PDF would be set in a fallback face); any line the
 *   sheet prints from lib/resume.ts (headline, summary, every bullet of every
 *   current role, tech, links, earlier roles, awards, government, projects,
 *   expertise, education, and "Updated <RESUME_UPDATED>") is missing from
 *   the rendered text, which is what a server still running old code looks
 *   like; the text carries a phone number, a salary or pay figure, an em
 *   dash, a platform service name, or a name the owner has asked never to
 *   appear; or the PDF is empty, malformed, or longer than three pages. The
 *   new file is written beside the old one and renamed over it, and the temp
 *   file is removed if that fails, so nothing half-written is left in public/.
 */

import { chromium } from "@playwright/test"
import { mkdir, rename, unlink, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const BASE = (process.env.RESUME_BASE_URL || "http://127.0.0.1:32221").replace(/\/+$/, "")
const OUT = resolve(ROOT, process.env.RESUME_PDF_OUT || "public/resume.pdf")
const CHROME = process.env.CHROME_PATH || "/opt/google/chrome/chrome"
const URL_ = `${BASE}/resume/print`
const MAX_PAGES = 3

/** The faces the sheet is set in. If any is missing the PDF is wrong. */
const FACES = ["800 12px Archivo", "700 12px Archivo", "400 12px 'IBM Plex Sans'", "600 12px 'IBM Plex Sans'", "400 12px 'IBM Plex Serif'", "400 12px 'IBM Plex Mono'"]

/**
 * Text that must never reach the PDF. The owner's standing rules: no phone
 * number, no salary, no em dash, and the prototype platform is described
 * under SysForge and never named.
 */
const FORBIDDEN = [
  [new RegExp("\\u2014"), "an em dash"],
  [/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/, "a phone number"],
  [/\bsalary\b|\bcompensation\b|\bper year\b|\/\s?yr\b|\bk\s?\/\s?year\b/i, "salary wording"],
  [/\$\s?\d{2,3}(?:,\d{3}|k)\b/i, "a pay figure"],
  [/campaign\s?brain|nominate|campaignbrain\.dev/i, "a name the owner asked to keep off public pages"],
  [/\bcb[a-z]{2,}\b/i, "a platform service name (described, never named)"],
  [/\bjunior\b/i, "the word the owner asked never to appear"],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/, "an IP address"],
]

function fail(msg) {
  console.error(`build-resume-pdf: FAILED: ${msg}`)
  console.error("build-resume-pdf: nothing written; the existing PDF is untouched.")
  process.exit(1)
}

/** Every line of the data that must appear in the print, as plain text. */
async function expectedStrings() {
  // Loading a .ts file makes Node print two warnings about doing so. They are
  // expected here and would bury the one line this script prints; every other
  // warning still prints.
  process.removeAllListeners("warning")
  process.on("warning", (w) => {
    if (w.name === "ExperimentalWarning" && /Type Stripping/i.test(w.message)) return
    if (w.code === "MODULE_TYPELESS_PACKAGE_JSON") return
    console.warn(`${w.name}: ${w.message}`)
  })
  let data
  try {
    // Node 24 strips TypeScript types on import. lib/resume.ts has no imports
    // of its own, so it loads as-is.
    data = await import(resolve(ROOT, "lib/resume.ts"))
  } catch (e) {
    fail(`could not load lib/resume.ts to check the print against it (${e?.message ?? e}). Run with Node 24 or later.`)
  }
  // Everything the sheet prints from the data, word for word. A server that
  // has not picked up the latest edit fails here, on the first changed line,
  // instead of quietly printing last week's resume. What the sheet leaves out
  // on purpose (earlier roles' bullets, STRENGTHS) is left out here too; group
  // labels are left out because CSS capitalises them and innerText follows.
  const out = []
  if (!data.ROLES?.length) fail("lib/resume.ts exported no roles; refusing to print an empty resume.")
  if (data.HEADLINE) out.push(data.HEADLINE)
  out.push(...(data.SUMMARY ?? []))
  // The hiring line. Required whenever the data says he is looking.
  if (data.AVAILABILITY?.open) out.push(data.AVAILABILITY.statement, data.AVAILABILITY.location)
  for (const r of data.ROLES) {
    out.push(r.title, r.company, r.years, r.location, r.context, ...(r.bullets ?? []), ...(r.tech ?? []))
    for (const l of r.links ?? []) out.push(l.label)
  }
  for (const r of data.EARLIER_ROLES ?? []) out.push(r.title, r.company, r.years, r.location, r.context)
  for (const a of data.AWARDS ?? []) out.push(a.award)
  out.push(...(data.GOVERNMENT ?? []))
  for (const p of data.PROJECTS ?? []) out.push(p.name, p.what)
  for (const e of data.EXPERTISE ?? []) out.push(e.area, ...e.items)
  for (const e of data.EDUCATION ?? []) out.push(e.what, e.where)
  if (data.RESUME_UPDATED) out.push(`Updated ${data.RESUME_UPDATED}`)
  return { strings: out.filter((s) => typeof s === "string"), updated: data.RESUME_UPDATED }
}

/** Pages in a PDF Chrome wrote: one /Type /Page object per page. */
function countPages(buf) {
  return (buf.toString("latin1").match(/\/Type\s*\/Page(?![s\w])/g) || []).length
}

async function main() {
  const { strings: expected, updated } = await expectedStrings()
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--headless=new"] }).catch((e) =>
    fail(`could not start Chrome at ${CHROME} (${e.message})`),
  )
  try {
    const page = await browser.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(e.message))

    const res = await page.goto(URL_, { waitUntil: "networkidle", timeout: 60_000 }).catch((e) => fail(`${URL_}: ${e.message}`))
    if (!res) fail(`${URL_}: no response`)
    if (res.status() !== 200) fail(`${URL_} answered ${res.status()}, not 200`)

    // The dev server's own overlay is not part of the page.
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" })
    await page.emulateMedia({ media: "print" })
    await page.evaluate(() => document.fonts.ready)

    const missingFaces = await page.evaluate((faces) => faces.filter((f) => !document.fonts.check(f, "Ab")), FACES)
    // check() is true for a face that is declared but never requested, so ask
    // for each one explicitly and then confirm it actually loaded.
    if (missingFaces.length) fail(`fonts not available: ${missingFaces.join(", ")}`)
    const unloaded = await page.evaluate(async (faces) => {
      const bad = []
      for (const f of faces) {
        const got = await document.fonts.load(f, "Ab")
        if (!got.length || got.some((ff) => ff.status !== "loaded")) bad.push(f)
      }
      return bad
    }, FACES)
    if (unloaded.length) fail(`fonts did not load: ${unloaded.join(", ")}`)

    const sheet = await page.$(".beta-cvp")
    if (!sheet) fail(`${URL_} has no .beta-cvp sheet; is that the resume print route?`)
    const text = (await sheet.innerText()).replace(/\s+/g, " ")
    if (text.length < 2000) fail(`the sheet has ${text.length} characters of text; a resume is longer than that`)
    if (!text.includes("Bradley S. Isenbek")) fail("the sheet does not carry the name")
    if (!text.includes("brad@bradley.io")) fail("the sheet does not carry the contact email")

    const norm = (s) => s.replace(/\s+/g, " ").trim()
    const missing = expected.map(norm).filter((s) => s && !text.includes(s))
    if (missing.length) {
      const shown = missing.slice(0, 5).map((m) => JSON.stringify(m.length > 90 ? `${m.slice(0, 90)}...` : m))
      fail(
        `the print and lib/resume.ts disagree (${missing.length} line${missing.length === 1 ? "" : "s"} not in the print): ${shown.join(", ")}` +
          `${missing.length > 5 ? ", and more" : ""}. Is ${BASE} serving the current working tree? The live service serves the last deploy.`,
      )
    }

    for (const [re, what] of FORBIDDEN) {
      const m = text.match(re)
      if (m) fail(`the sheet contains ${what}: ${JSON.stringify(text.slice(Math.max(0, m.index - 40), m.index + 40))}`)
    }
    if (errors.length) fail(`the page threw: ${errors.join(" | ")}`)

    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false, format: "Letter", tagged: true, outline: true })
    if (!pdf || pdf.length < 10_000 || pdf.subarray(0, 5).toString("latin1") !== "%PDF-") fail(`Chrome returned ${pdf?.length ?? 0} bytes that are not a PDF`)
    const pages = countPages(pdf)
    if (pages < 1) fail("the PDF has no pages")
    if (pages > MAX_PAGES) fail(`the PDF runs to ${pages} pages; the limit is ${MAX_PAGES}. Tighten lib/resume.ts or the beta-cvp block in app/kit.css.`)

    await mkdir(dirname(OUT), { recursive: true })
    // The temp file sits beside the target so the rename is atomic (same
    // filesystem). If either step throws, remove it: public/ is what deploy.sh
    // commits, and a half-written file there would ship.
    const tmp = `${OUT}.tmp-${process.pid}`
    try {
      await writeFile(tmp, pdf)
      await rename(tmp, OUT)
    } catch (e) {
      await unlink(tmp).catch(() => {})
      fail(`could not write ${OUT} (${e.message})`)
    }
    console.log(
      `build-resume-pdf: wrote ${OUT} (${pages} page${pages === 1 ? "" : "s"}, ${(pdf.length / 1024).toFixed(1)} KB, data of ${updated}) from ${URL_}`,
    )
  } finally {
    await browser.close()
  }
}

main().catch((e) => fail(e?.stack ?? String(e)))
