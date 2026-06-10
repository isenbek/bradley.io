import { test, expect } from "@playwright/test"
import { CORE_PATHS, slugFor } from "./urls"

/**
 * Visual regression sweep — full-page screenshots compared against
 * baseline images stored under `tests/visual.spec.ts-snapshots/`.
 *
 * Run with:
 *   bun run audit:visual           # compare against baselines
 *   bun run audit:visual:update    # refresh baselines after intentional UI change
 *
 * Scope: only CORE_PATHS (21 URLs × 3 viewports = 63 snapshots). The full
 * sitemap (audit:all) is too large to baseline meaningfully — visuals are
 * for "did the UI shift in a way I didn't expect on the spine of the site".
 *
 * Dynamic elements are masked so live data / deploy timestamps don't
 * cause every run to look like a regression:
 *   - .v3-footer        (version pill + deployed-X-ago)
 *   - .v3-pulse         (24h activity pulse polled at runtime)
 *   - .v3-live          (any "live" / status indicator)
 *   - [data-live]       (escape hatch for future dynamic widgets)
 *   - .v3-cheat__svg    (heatmap cell counts shift when data refreshes)
 *
 * Tolerances:
 *   - maxDiffPixelRatio: 0.005 (0.5%) — covers anti-aliasing / font-render
 *     wobble across runs without letting actual visual regressions through.
 */

const MASK_SELECTORS = [
  ".v3-footer",
  ".v3-pulse",
  ".v3-live",
  "[data-live]",
  ".v3-cheat__svg",
]

// Visual tests can flake on fonts-not-yet-loaded or reveal-on-scroll
// timing, both of which recover instantly on re-run. One retry is enough
// — anything that fails twice is a real visual regression.
test.describe.configure({ retries: 1 })

for (const path of CORE_PATHS) {
  const slug = slugFor(path)

  test.describe(`visual ${path}`, () => {
    test(`@visual matches baseline`, async ({ page }, testInfo) => {
      const project = testInfo.project.name

      await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 25_000,
      })
      await page.waitForSelector(".v3-nav", { timeout: 10_000 })
      await page.waitForSelector(".v3-footer", { timeout: 10_000 })
      await page.waitForLoadState("load").catch(() => {})

      // Disable CSS transitions/animations so reveal-on-scroll states are
      // captured deterministically. Also force the IntersectionObserver-
      // gated reveal class on so first-screen reveal animations don't leave
      // some elements stuck mid-fade.
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
          }
        `,
      })
      await page.evaluate(() => {
        document.querySelectorAll(".v3-reveal").forEach((el) => {
          el.classList.add("is-in")
        })
      })

      // Wait for web fonts to actually finish loading. Without this the
      // first run after a deploy frequently catches a fallback-font render
      // and produces a spurious diff against the baseline.
      await page.evaluate(() =>
        document.fonts ? document.fonts.ready : Promise.resolve()
      )
      await page.waitForTimeout(600)

      // Scroll once to trigger any lazy-loaded images / IntersectionObservers
      // for elements below the fold, then scroll back so the screenshot starts
      // at the top of the document.
      await page.evaluate(async () => {
        const total = document.documentElement.scrollHeight
        const step = window.innerHeight
        for (let y = 0; y < total; y += step) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 60))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(300)

      // Resolve the locator list once — passing an array of Locator objects
      // is cleaner than relying on Playwright to re-resolve string selectors.
      const masks = MASK_SELECTORS.map((sel) => page.locator(sel))

      await expect(page).toHaveScreenshot(`${project}-${slug}.png`, {
        fullPage: true,
        animations: "disabled",
        caret: "hide",
        scale: "css",
        mask: masks,
        // Solid pink mask makes regressions obvious if a mask region
        // resizes (which is itself a visual change worth flagging).
        maskColor: "#FF00FF",
        maxDiffPixelRatio: 0.005,
        threshold: 0.2,
        timeout: 15_000,
      })
    })
  })
}
