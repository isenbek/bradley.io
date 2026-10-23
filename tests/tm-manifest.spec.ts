import { test, expect } from "@playwright/test"

/**
 * The link manifest (/.well-known/tm-manifest.json, lib/tm-manifest.ts).
 *
 * Its titles are read from source, so this holds them to what the browser
 * actually shows: each page's rendered <title>, with the site suffix off.
 * And its page list must be the sitemap's, key for key, because the reader
 * ignores any entry the sitemap does not list.
 */

const SUFFIX = /\s*(?:[·|]\s*(?:bio·)?bradley\.io|\|\s*Bradley Isenbek)\s*$/
const strip = (t: string) => t.replace(SUFFIX, "").replace(SUFFIX, "").trim()

test("manifest pages are the sitemap's, and titles match the rendered <title>", async ({ request, page }) => {
  test.setTimeout(180_000)
  const res = await request.get("/.well-known/tm-manifest.json")
  expect(res.ok()).toBe(true)
  expect(res.headers()["content-type"]).toContain("application/json")
  const body = await res.body()
  expect(body.length).toBeLessThanOrEqual(256 * 1024)
  const m = JSON.parse(body.toString())
  expect(m.tm_manifest).toBe(1)
  expect(m.site).toBe("bradley.io")
  expect(m.repository).toBe("isenbek/bradley.io")

  const sm = await (await request.get("/sitemap.xml")).text()
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (x) => x[1].replace(/^https:\/\/bradley\.io/, "") || "/",
  )
  expect(Object.keys(m.pages).sort()).toEqual([...locs].sort())

  const wrong: string[] = []
  for (const [route, entry] of Object.entries<{ title?: string }>(m.pages)) {
    await page.goto(route, { waitUntil: "domcontentloaded" })
    const shown = strip(await page.title())
    if (entry.title !== shown) wrong.push(`${route}: manifest "${entry.title}", page "${shown}"`)
  }
  expect(wrong).toEqual([])
})
