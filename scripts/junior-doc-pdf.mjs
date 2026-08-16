// Render the /junior guide to a print-ready PDF with page numbers.
//
// Browsers cannot render CSS page counters (@page margin boxes are unsupported
// in Chrome and Safari), so "Page N of M" has to come from the PDF generator's
// own header/footer templates. That is what this does — and it means Armando
// gets correct pagination without having to remember to tick "Headers and
// footers" in his print dialog.
//
// Run after editing the doc:
//   JR_PIN=$(sudo grep -oP '^JUNIOR_PIN=\K.*' /etc/bradley-io.env) \
//     node scripts/junior-doc-pdf.mjs
//
// Output goes straight into the PIN-gated recovery store.

import { chromium } from "@playwright/test"

const PIN = process.env.JR_PIN
const SLUG = process.env.SLUG || "two-isps-one-pi"
const OUT = process.env.OUT || `/mnt/ursa/build/openwrt-rpi5/recovery/${SLUG}.pdf`
const BASE = process.env.BASE || "https://bradley.io"

if (!PIN) {
  console.error("JR_PIN not set — cannot authenticate to the gated doc")
  process.exit(1)
}

const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()

const auth = await page.request.post(`${BASE}/api/junior/auth`, { data: { pin: PIN } })
if (auth.status() !== 200) {
  console.error(`auth failed: ${auth.status()}`)
  await browser.close()
  process.exit(1)
}

await page.goto(`${BASE}/junior/doc/${SLUG}`, { waitUntil: "networkidle" })

// Pull the revision out of the page so the running header stays truthful
// without anyone having to remember to update it here.
const rev = await page
  .evaluate(() => document.body.innerText.match(/Rev\s+\d+/)?.[0] ?? "")
  .catch(() => "")

const title = await page.title().catch(() => "Two ISPs, One Pi")

await page.emulateMedia({ media: "print" })
await page.pdf({
  path: OUT,
  format: "Letter",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:7pt;width:100%;padding:0 14mm;color:#666;font-family:sans-serif;">${title}${rev ? ` — ${rev}` : ""}</div>`,
  footerTemplate:
    '<div style="font-size:7pt;width:100%;padding:0 14mm;color:#666;font-family:sans-serif;text-align:right;">' +
    'Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  margin: { top: "18mm", bottom: "16mm", left: "14mm", right: "14mm" },
})

console.log(`wrote ${OUT} (${title}${rev ? ` ${rev}` : ""})`)
await browser.close()
