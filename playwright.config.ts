import { defineConfig, devices } from "@playwright/test"

/**
 * Site audit harness — visits every URL on the running site across three
 * viewports and asserts visual / behavioral perfection.
 *
 * Run against an already-running dev or prod server (defaults to dev on 32221).
 * Override with `PLAYWRIGHT_BASE_URL=https://bradley.io npx playwright test`.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:32221"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["iPad (gen 7)"],
        defaultBrowserType: "chromium",
        viewport: { width: 820, height: 1180 },
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 14 Pro"],
        defaultBrowserType: "chromium",
        viewport: { width: 393, height: 852 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    },
  ],
})
