import { test, expect } from "@playwright/test"
import { launch as launchChrome, type LaunchedChrome } from "chrome-launcher"
import lighthouse, { type Flags, type RunnerResult } from "lighthouse"

/**
 * Lighthouse performance budget audit.
 *
 * For each critical page, runs a full Lighthouse audit (mobile sim by
 * default — matches what users see and what Search Console scores) and
 * fails the test if any metric blows past its budget.
 *
 * Lighthouse is heavy (~15s per page including warmup), so we run a
 * curated list of ~6 pages rather than all 21 in CORE_PATHS. These are
 * the ones whose perf actually matters for first impressions / SEO.
 *
 * Run with:
 *   bun run audit:perf            # against the running local server
 *   bun run audit:perf:prod       # against https://bradley.io
 *
 * Tune budgets at the top of this file. After tightening a budget, ship
 * the fix in the same PR so the new floor is enforced going forward.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:32221"

// Pages chosen because they're (a) entry points users actually land on
// from search/social, or (b) shape-shifting dashboards where regressions
// are easy to introduce. Adjust as the site evolves.
const PERF_PATHS = [
  "/",
  "/about",
  "/services",
  "/projects",
  "/projects/nominate-ai",
  "/ai-pilot",
]

/**
 * Hard thresholds. Failing any one of these fails the test.
 *
 * Defaults reflect a healthy modern static-rendered Next.js site on a
 * 4× CPU throttled mobile sim (Lighthouse's default). Tighten as the
 * site improves, loosen only with a stated reason.
 */
interface Budget {
  // Category scores (0–1 in Lighthouse, we show 0–100 in messages)
  performance: number       // overall perf category
  accessibility: number     // axe is the source of truth, but LH catches more
  bestPractices: number
  seo: number
  // Core Web Vitals + key metrics (milliseconds, except CLS which is unitless)
  fcp: number               // First Contentful Paint
  lcp: number               // Largest Contentful Paint — Core Web Vital
  cls: number               // Cumulative Layout Shift — Core Web Vital
  tbt: number               // Total Blocking Time — proxies INP
  speedIndex: number        // Speed Index
}

// Calibrated to the current state of the site (2026-06-10) with a small
// buffer so today's perf passes and regressions get caught immediately.
// Tighten over time — every improvement should ratchet the floor down.
//
// Reference baseline AFTER the eager-LCP fix:
//   Perf 94–96 · A11y 98+ · BP 100 · SEO 100
//   FCP ~1050ms · LCP ~2700–3110ms · CLS 0 · TBT ~50–105ms
//
// Previous baseline (pre-fix) was Perf 83/LCP 4519ms on home — eager
// reveal on above-the-fold elements + first content panel dropped LCP
// by ~1.8s and lifted Performance by ~13 points.
//
// Note: Lighthouse mobile sim uses Slow 4G + 4× CPU throttle, so LCP
// in the ~3s range corresponds to a much faster real-world LCP — but
// it's still the metric Search Console looks at.
const BUDGETS: Budget = {
  performance: 0.9,
  accessibility: 0.95,
  bestPractices: 0.95,
  seo: 0.95,
  fcp: 1500,
  lcp: 3400,
  cls: 0.05,
  tbt: 200,
  speedIndex: 1500,
}

const PAGE_OVERRIDES: Record<string, Partial<Budget>> = {}

function budgetFor(path: string): Budget {
  return { ...BUDGETS, ...(PAGE_OVERRIDES[path] ?? {}) }
}

function audit(value: number, limit: number, name: string, unit: string): string | null {
  if (value <= limit) return null
  return `${name}: ${value.toFixed(unit === "" ? 3 : 0)}${unit} > budget ${limit}${unit}`
}

function auditMin(value: number, floor: number, name: string): string | null {
  if (value >= floor) return null
  const pct = Math.round(value * 100)
  return `${name}: ${pct} < budget ${Math.round(floor * 100)}`
}

interface CategoryScore { score: number | null }
interface AuditNumeric { numericValue?: number; score?: number | null }

async function runLighthouse(
  url: string,
  chrome: LaunchedChrome
): Promise<RunnerResult> {
  const flags: Flags = {
    port: chrome.port,
    logLevel: "error",
    output: ["json"],
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  }
  const result = await lighthouse(url, flags)
  if (!result) throw new Error(`lighthouse returned no result for ${url}`)
  return result
}

// Lighthouse is sequential per Chrome instance and CPU-heavy. Run one
// page at a time — parallelizing here just makes each result less stable.
test.describe.configure({ mode: "serial", retries: 1 })

for (const path of PERF_PATHS) {
  // eslint-disable-next-line no-empty-pattern
  test(`@perf ${path} stays within budget`, async ({}, testInfo) => {
    test.setTimeout(90_000)
    const url = `${BASE_URL}${path}`
    const budget = budgetFor(path)

    let chrome: LaunchedChrome | undefined
    try {
      chrome = await launchChrome({
        chromeFlags: [
          "--headless=new",
          "--no-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
        ],
      })
      const result = await runLighthouse(url, chrome)
      const lhr = result.lhr

      const cats = lhr.categories as Record<string, CategoryScore>
      const audits = lhr.audits as Record<string, AuditNumeric>
      const perf = cats["performance"]?.score ?? 0
      const a11y = cats["accessibility"]?.score ?? 0
      const bp = cats["best-practices"]?.score ?? 0
      const seo = cats["seo"]?.score ?? 0
      const fcp = audits["first-contentful-paint"]?.numericValue ?? 0
      const lcp = audits["largest-contentful-paint"]?.numericValue ?? 0
      const cls = audits["cumulative-layout-shift"]?.numericValue ?? 0
      const tbt = audits["total-blocking-time"]?.numericValue ?? 0
      const si = audits["speed-index"]?.numericValue ?? 0

      const violations = [
        auditMin(perf, budget.performance, "Performance"),
        auditMin(a11y, budget.accessibility, "Accessibility"),
        auditMin(bp, budget.bestPractices, "Best Practices"),
        auditMin(seo, budget.seo, "SEO"),
        audit(fcp, budget.fcp, "FCP", "ms"),
        audit(lcp, budget.lcp, "LCP", "ms"),
        audit(cls, budget.cls, "CLS", ""),
        audit(tbt, budget.tbt, "TBT", "ms"),
        audit(si, budget.speedIndex, "Speed Index", "ms"),
      ].filter((v): v is string => v !== null)

      // Always attach the score summary so passing runs leave a paper trail.
      const summary = [
        `Performance: ${Math.round(perf * 100)}/${Math.round(budget.performance * 100)}`,
        `Accessibility: ${Math.round(a11y * 100)}/${Math.round(budget.accessibility * 100)}`,
        `Best Practices: ${Math.round(bp * 100)}/${Math.round(budget.bestPractices * 100)}`,
        `SEO: ${Math.round(seo * 100)}/${Math.round(budget.seo * 100)}`,
        `FCP: ${Math.round(fcp)}ms / ${budget.fcp}ms`,
        `LCP: ${Math.round(lcp)}ms / ${budget.lcp}ms`,
        `CLS: ${cls.toFixed(3)} / ${budget.cls}`,
        `TBT: ${Math.round(tbt)}ms / ${budget.tbt}ms`,
        `Speed Index: ${Math.round(si)}ms / ${budget.speedIndex}ms`,
      ].join("\n")
      await testInfo.attach(`lighthouse-${path.replace(/\//g, "_") || "home"}.txt`, {
        body: summary,
        contentType: "text/plain",
      })

      // Attach the raw JSON for deep dives when something fails.
      if (violations.length > 0) {
        await testInfo.attach(`lighthouse-raw-${path.replace(/\//g, "_") || "home"}.json`, {
          body: JSON.stringify(lhr, null, 2),
          contentType: "application/json",
        })
      }

      expect(
        violations,
        `Lighthouse budget violations on ${path}:\n  • ${violations.join("\n  • ")}\n\nFull scores:\n${summary}`
      ).toEqual([])
    } finally {
      await chrome?.kill()
    }
  })
}
