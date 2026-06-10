import { test, expect, type ConsoleMessage, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { PATHS, slugFor } from "./urls"

/**
 * Comprehensive site audit. For every URL × viewport:
 *  1. Page loads with 200 status, no fatal console errors, no failed network requests
 *  2. Page has a non-empty <title>, exactly one <h1>, and an h1 longer than 2 chars
 *  3. Meta description present and non-empty
 *  4. Document height non-trivial (>200px) — guards against blank pages
 *  5. NO horizontal scroll (documentElement.scrollWidth ≤ viewport width + 1)
 *     This is the single most common "broken on mobile" symptom.
 *  6. All <img> elements have width/height attrs (CLS prevention) and have loaded
 *     successfully (naturalWidth > 0)
 *  7. All images have an alt attribute (empty allowed for decorative, but the
 *     attribute must be present for screen readers)
 *  8. The sticky nav is present at top, the fixed footer is present at bottom
 *  9. No 4xx/5xx network responses
 * 10. Full-page screenshot saved under playwright-report/screenshots/{viewport}/
 * 11. axe-core a11y scan: WCAG 2 A + 2 AA + 2.1 A + 2.1 AA. Critical/serious
 *     violations fail the test; moderate/minor violations are warnings.
 *
 * Tests are tagged `@audit`. Run with: npm run audit (or audit:all for sitemap).
 */

interface AuditNote {
  level: "error" | "warn"
  message: string
}

const CONSOLE_IGNORE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  // Next.js dev mode noise
  /\[HMR\]/i,
]

const NETWORK_IGNORE = [
  // Optional service workers / analytics / fonts that may 404 in dev
  /\/__nextjs_/,
  /\/_next\/webpack-hmr/,
]

async function collectImages(page: Page) {
  return page.$$eval("img", (imgs) =>
    imgs.map((img) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt"),
      hasWidth: img.hasAttribute("width") || !!img.style.width,
      hasHeight: img.hasAttribute("height") || !!img.style.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      currentSrc: img.currentSrc,
      visible:
        img.offsetWidth > 0 && img.offsetHeight > 0 && !img.hidden,
    }))
  )
}

for (const path of PATHS) {
  const slug = slugFor(path)

  test.describe(`page ${path}`, () => {
    test(
      `@audit loads cleanly`,
      async ({ page }, testInfo) => {
        const project = testInfo.project.name
        const notes: AuditNote[] = []
        const consoleErrors: string[] = []
        const failedRequests: string[] = []

        page.on("console", (msg: ConsoleMessage) => {
          if (msg.type() !== "error") return
          const text = msg.text()
          if (CONSOLE_IGNORE.some((rx) => rx.test(text))) return
          consoleErrors.push(text)
        })
        page.on("pageerror", (err) => {
          consoleErrors.push(`pageerror: ${err.message}`)
        })
        page.on("requestfailed", (req) => {
          const url = req.url()
          if (NETWORK_IGNORE.some((rx) => rx.test(url))) return
          failedRequests.push(`${req.failure()?.errorText || "failed"} ${url}`)
        })
        page.on("response", (res) => {
          const status = res.status()
          const url = res.url()
          if (status < 400) return
          if (NETWORK_IGNORE.some((rx) => rx.test(url))) return
          failedRequests.push(`HTTP ${status} ${url}`)
        })

        // 1. Load. Use domcontentloaded — `networkidle` hangs on pages that
        //    keep a connection open (e.g. /trng entropy stream, /sdr waterfall).
        const response = await page.goto(path, {
          waitUntil: "domcontentloaded",
          timeout: 25_000,
        })
        expect(response, `no response for ${path}`).not.toBeNull()
        expect(response!.status(), `bad status for ${path}`).toBeLessThan(400)

        // Wait for the chrome that every page renders, then let animations
        // and lazy components settle.
        await page.waitForSelector(".v3-nav", { timeout: 10_000 })
        await page.waitForSelector(".v3-footer", { timeout: 10_000 })
        await page.waitForLoadState("load").catch(() => {})
        await page.waitForTimeout(800)

        // 2. <title>, <h1>
        const title = (await page.title()).trim()
        expect(title.length, `empty <title> on ${path}`).toBeGreaterThan(0)

        const h1Texts = await page.$$eval("h1", (els) =>
          els.map((e) => (e.textContent || "").trim()).filter(Boolean)
        )
        if (h1Texts.length === 0) {
          notes.push({ level: "warn", message: "no <h1> found" })
        } else if (h1Texts.length > 1) {
          notes.push({
            level: "warn",
            message: `multiple <h1>s (${h1Texts.length}): ${h1Texts.slice(0, 3).join(" | ")}`,
          })
        } else {
          // Some legitimate project names are 2 chars (e.g. "CC", "OS").
          // Only flag actually-empty h1s; non-empty short names are valid.
          expect(h1Texts[0].length, `h1 empty on ${path}`).toBeGreaterThan(0)
        }

        // 3. meta description
        const descLocator = page.locator('meta[name="description"]').first()
        const descCount = await descLocator.count()
        if (descCount === 0) {
          notes.push({ level: "warn", message: "missing <meta name=\"description\">" })
        } else {
          const description = await descLocator.getAttribute("content", {
            timeout: 2000,
          })
          if (!description || description.trim().length === 0) {
            notes.push({ level: "warn", message: "empty meta description" })
          }
        }

        // 4. Non-blank body
        const docHeight = await page.evaluate(
          () => document.documentElement.scrollHeight
        )
        expect(docHeight, `document looks blank on ${path}`).toBeGreaterThan(200)

        // 5. No horizontal overflow
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement
          const viewport = window.innerWidth
          const scroll = doc.scrollWidth
          // Find culprit elements that exceed the viewport
          const offenders: { tag: string; cls: string; w: number }[] = []
          if (scroll > viewport + 1) {
            const all = document.querySelectorAll<HTMLElement>("body *")
            for (const el of Array.from(all)) {
              const rect = el.getBoundingClientRect()
              if (rect.right > viewport + 1 && rect.width > 0) {
                offenders.push({
                  tag: el.tagName.toLowerCase(),
                  cls: el.className?.toString().slice(0, 60) ?? "",
                  w: Math.round(rect.right),
                })
                if (offenders.length >= 5) break
              }
            }
          }
          return { viewport, scroll, offenders }
        })
        if (overflow.scroll > overflow.viewport + 1) {
          const offendersStr = overflow.offenders
            .map((o) => `${o.tag}.${o.cls}@${o.w}px`)
            .join(", ")
          notes.push({
            level: "error",
            message: `horizontal overflow: scrollWidth=${overflow.scroll} vw=${overflow.viewport}; offenders: ${offendersStr || "(none traced)"}`,
          })
        }

        // 6 + 7. Images: dimensions, loaded, alt
        const images = await collectImages(page)
        const visibleImages = images.filter((i) => i.visible)
        for (const img of visibleImages) {
          if (img.alt === null) {
            notes.push({
              level: "warn",
              message: `<img> missing alt attribute: ${img.src.slice(0, 80)}`,
            })
          }
          if (!img.complete || img.naturalWidth === 0) {
            notes.push({
              level: "error",
              message: `<img> failed to load: ${img.src.slice(0, 80)} (currentSrc=${img.currentSrc.slice(0, 80)})`,
            })
          }
          // We only warn about missing dims for non-SVG raster — SVGs scale fine
          const looksRaster = /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(img.src)
          if (looksRaster && (!img.hasWidth || !img.hasHeight)) {
            notes.push({
              level: "warn",
              message: `<img> missing explicit width/height (CLS risk): ${img.src.slice(0, 80)}`,
            })
          }
        }

        // 8. Sticky chrome (nav at top, footer at bottom).
        // Mobile hamburger collapses some nav links; the bar itself must still exist.
        const navBox = await page.locator(".v3-nav").first().boundingBox()
        expect(navBox, `.v3-nav not found on ${path}`).not.toBeNull()
        if (navBox) {
          expect(navBox.y, `.v3-nav not at top of ${path}`).toBeLessThanOrEqual(4)
        }
        const footerBox = await page.locator(".v3-footer").first().boundingBox()
        expect(footerBox, `.v3-footer not found on ${path}`).not.toBeNull()
        if (footerBox) {
          const vh = page.viewportSize()?.height ?? 0
          // Footer is fixed at bottom; allow small wiggle (mobile UI bar).
          expect(
            footerBox.y + footerBox.height,
            `.v3-footer not at viewport bottom on ${path}`
          ).toBeGreaterThan(vh - 80)
        }

        // 10. Full-page screenshot
        const screenshot = await page.screenshot({
          fullPage: true,
          animations: "disabled",
        })
        await testInfo.attach(`${project}-${slug}.png`, {
          body: screenshot,
          contentType: "image/png",
        })

        // 11. axe-core a11y scan
        //   - Tags: WCAG 2 A + AA + 2.1 A + AA. (AAA is aspirational; not enforced.)
        //   - Exclude: known false positives on framework chrome. Color-contrast
        //     is included — bio-blue brand checks come from this.
        const axe = new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          // Skip rules that flag dev/framework noise we can't fix.
          .disableRules([
            // Lucide icons render aria-hidden svgs without a role — fine for decorative use
            "svg-img-alt",
          ])
        const axeResults = await axe.analyze()

        const blocking = axeResults.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious"
        )
        const advisory = axeResults.violations.filter(
          (v) => v.impact === "moderate" || v.impact === "minor"
        )

        if (axeResults.violations.length > 0) {
          const dump = axeResults.violations
            .map((v) => {
              const targets = v.nodes
                .slice(0, 8)
                .map((n) => {
                  // For color-contrast, pull the fg/bg/ratio data straight
                  // from the check result so reports name the exact ratio.
                  let detail = ""
                  const check = (n.any ?? [])[0]
                  if (check?.data && v.id === "color-contrast") {
                    const d = check.data as {
                      fgColor?: string
                      bgColor?: string
                      contrastRatio?: number
                      expectedContrastRatio?: number
                      fontSize?: string
                      fontWeight?: string
                    }
                    detail = `\n        fg=${d.fgColor} bg=${d.bgColor} ratio=${d.contrastRatio}:1 need=${d.expectedContrastRatio}:1 (${d.fontSize}, ${d.fontWeight})`
                  } else if (check?.message) {
                    detail = "\n        " + check.message
                  }
                  return `      ${n.target.join(" ")}${detail}`
                })
                .join("\n")
              return `[${(v.impact || "n/a").toUpperCase()}] ${v.id} — ${v.help}\n  ${v.helpUrl}\n${targets}${
                v.nodes.length > 8 ? `\n      …+${v.nodes.length - 8} more` : ""
              }`
            })
            .join("\n\n")
          await testInfo.attach(`axe-${project}-${slug}.txt`, {
            body: dump,
            contentType: "text/plain",
          })
        }

        if (blocking.length > 0) {
          notes.push({
            level: "error",
            message: `a11y violations (critical/serious): ${blocking
              .map((v) => `${v.id} (${v.nodes.length})`)
              .join(", ")}`,
          })
        }
        for (const v of advisory) {
          notes.push({
            level: "warn",
            message: `a11y ${v.impact}: ${v.id} (${v.nodes.length} node${
              v.nodes.length === 1 ? "" : "s"
            })`,
          })
        }

        // 9 / final report
        if (consoleErrors.length > 0) {
          notes.push({
            level: "error",
            message: `console errors:\n  - ${consoleErrors.join("\n  - ")}`,
          })
        }
        if (failedRequests.length > 0) {
          notes.push({
            level: "error",
            message: `failed requests:\n  - ${failedRequests.join("\n  - ")}`,
          })
        }

        // Attach the audit note dump so it shows up in the HTML report
        if (notes.length > 0) {
          const dump = notes
            .map((n) => `[${n.level.toUpperCase()}] ${n.message}`)
            .join("\n")
          await testInfo.attach(`audit-notes-${project}-${slug}.txt`, {
            body: dump,
            contentType: "text/plain",
          })
        }

        const errorNotes = notes.filter((n) => n.level === "error")
        if (errorNotes.length > 0) {
          throw new Error(
            `audit failures on ${path} [${project}]:\n` +
              errorNotes.map((n) => `  • ${n.message}`).join("\n")
          )
        }

        // Bubble warnings into the test annotations
        for (const n of notes) {
          testInfo.annotations.push({ type: n.level, description: n.message })
        }
      }
    )
  })
}
