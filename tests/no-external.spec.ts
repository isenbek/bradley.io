import { test, expect } from "@playwright/test"
import { CORE_PATHS, slugFor } from "./urls"

/**
 * Anti-cloud guard — "Host Local, Think Global".
 *
 * For each page, asserts that NO requests are made to any cloud /
 * third-party host on page load. If a regression slips in (a Google
 * Analytics tag, a CDN-hosted font, a tracking pixel, an external SVG,
 * an iframe to a third-party widget), this test fails immediately and
 * names the offending URL + initiator.
 *
 * Permitted exceptions:
 *   - `about:` / `chrome-extension:` / `chrome:` etc. — browser-internal
 *   - `data:` URLs — inlined assets
 *   - blob: URLs — runtime-created
 *
 * Permitted hosts (the operator's own self-hosted infra — these live on
 * the same kind of local-hardware boxes that bradley.io itself runs on,
 * not on AWS/GCP/Vercel/Cloudflare):
 *   - tinymachines.ai + subdomains (dragonfli, sdr, hotbits, etc.)
 *   - bradley.io + subdomains
 *
 * USER-CLICKED outbound links (github.com, the tinymachines docs URL the
 * user actually clicks) do NOT count — this test only watches what the
 * browser loads automatically during page render.
 */

const ALLOWED_PREFIXES = ["data:", "blob:", "about:", "chrome:", "chrome-extension:"]

// Suffix match — `.tinymachines.ai` matches any subdomain.
const ALLOWED_HOST_SUFFIXES = [
  "tinymachines.ai",
  "bradley.io",
]

function getOriginHost(): string {
  const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:32221"
  return new URL(base).host
}

function hostAllowed(host: string, originHost: string): boolean {
  if (host === originHost) return true
  return ALLOWED_HOST_SUFFIXES.some(
    (s) => host === s || host.endsWith("." + s)
  )
}

for (const path of CORE_PATHS) {
  const slug = slugFor(path)

  test(`@no-external ${path} loads no external resources`, async ({ page }, testInfo) => {
    const allowedHost = getOriginHost()
    const externals: { url: string; type: string; initiator?: string }[] = []

    page.on("request", (req) => {
      const url = req.url()
      if (ALLOWED_PREFIXES.some((p) => url.startsWith(p))) return
      let host: string
      try {
        host = new URL(url).host
      } catch {
        return
      }
      if (hostAllowed(host, allowedHost)) return
      externals.push({
        url,
        type: req.resourceType(),
      })
    })

    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 25_000 })
    await page.waitForSelector(".v3-nav", { timeout: 10_000 })
    await page.waitForSelector(".v3-footer", { timeout: 10_000 })
    await page.waitForLoadState("load").catch(() => {})
    // Hold a moment so any deferred fetches / lazy-loaded resources fire too.
    await page.waitForTimeout(1500)

    if (externals.length > 0) {
      const dump = externals
        .map((e) => `  [${e.type}] ${e.url}`)
        .join("\n")
      await testInfo.attach(`external-requests-${slug}.txt`, {
        body: dump,
        contentType: "text/plain",
      })
    }

    expect(
      externals,
      `${path} loaded ${externals.length} external resource(s):\n` +
        externals.map((e) => `  • [${e.type}] ${e.url}`).join("\n") +
        "\n\nAnti-Cloud rule: every resource the page loads on render must" +
        " come from the same origin. Self-host any external dependency" +
        " before merging."
    ).toEqual([])
  })
}
