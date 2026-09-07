#!/usr/bin/env node
/**
 * Money-math selftests for the truck quote pad. A quote a tradesperson
 * hands a customer must never say $0.30000000000000004; cents-internal
 * math is the guarantee and these are its proof.
 *
 * Run with BUN (the house runtime): it resolves the extensionless TS
 * imports these modules use for Next. node --experimental-strip-types
 * cannot (ERR_MODULE_NOT_FOUND on ./quote-math).
 */
import { toCents, parseQty, money, lineTotal, quoteTotal, depositCents, validUntil, quoteAsText } from "../components/housecalls/quote-math.ts"

const cases = [
  ["dollars to cents, rounded", toCents("19.99") === 1999 && toCents("0.1") === 10],
  ["currency junk stripped", toCents("$1,250.00") === 125000],
  ["garbage is zero, never NaN", toCents("abc") === 0 && toCents("-5") === 0],
  ["qty parses decimals", parseQty("2.5") === 2.5 && parseQty("") === 0],
  ["line total is qty x unit in cents", lineTotal({ desc: "wire", qty: "3", unit: "12.50" }) === 3750],
  ["the classic float trap cannot appear", lineTotal({ desc: "x", qty: "3", unit: "0.1" }) === 30],
  ["quote total sums lines", quoteTotal([{ desc: "a", qty: "1", unit: "100" }, { desc: "b", qty: "2", unit: "25.25" }]) === 15050],
  ["deposit is a rounded percent", depositCents(15050, "25") === 3763],
  ["deposit caps at 100 and floors at 0", depositCents(1000, "150") === 1000 && depositCents(1000, "-5") === 0 && depositCents(1000, "junk") === 0],
  ["money renders like money", money(125000) === "$1,250.00"],
  ["valid-until defaults to 14 days", validUntil("2026-09-06T12:00:00Z", "") === "2026-09-20"],
  ["valid-until honors the shop default", validUntil("2026-09-06T12:00:00Z", "30") === "2026-10-06"],
]

const text = quoteAsText(
  { name: "Sparks & Co", city: "Grand Rapids", phone: "616-555-0100", email: "", license: "E-12345", insured: "Licensed and insured", terms: "Payment due on completion.", deposit_pct: "25", valid_days: "14" },
  {
    customer: "Pat Customer", address: "123 Main St", scope: "Panel swap", exclusions: "Drywall repair", notes: "",
    deposit_pct: "25", valid_until: "2026-09-20",
    items: [{ desc: "200A panel", qty: "1", unit: "800" }, { desc: "Labor", qty: "6", unit: "125" }],
  }
)
cases.push(
  ["text form carries the total", text.includes("TOTAL: $1,550.00")],
  ["text form carries the deposit", text.includes("Deposit to schedule: $387.50 (25%)")],
  ["text form carries license and validity", text.includes("License E-12345") && text.includes("good through 2026-09-20")],
  ["text form carries exclusions", text.includes("Not included: Drywall repair")],
  ["text form has no em dash", !text.includes("\u2014")],
)

let ok = true
for (const [name, pass] of cases) {
  console.log(`${pass ? "PASS" : "FAIL"} quote: ${name}`)
  ok &&= pass
}
// ---- change-order pad (co-math.ts) ----
const { signedCents, signedMoney, coNumber, changeAsText } = await import("../components/housecalls/co-math.ts")
const co = {
  co_number: "CO-20260906-01", customer: "Pat", address: "123 Main St", job_ref: "Q-114",
  description: "Knob-and-tube found behind kitchen wall; replace run to panel",
  reason: "Opened wall for the new circuit", amount: "450", mode: "add", days: "1",
  signed_name: "Pat Customer", signed_date: "2026-09-06",
}
const coText = changeAsText({ name: "Sparks & Co", phone: "616-555-0100", email: "", license: "E-12345", city: "", insured: "", terms: "" }, co)
const coCases = [
  ["add is positive cents", signedCents("450", "add") === 45000],
  ["deduct is negative cents", signedCents("450", "deduct") === -45000],
  ["signed money reads like the trade says it", signedMoney(45000) === "$450.00 add" && signedMoney(-45000) === "($450.00) deduct"],
  ["co number is speakable", coNumber(new Date("2026-09-06T15:00:00Z"), 3) === "CO-20260906-03"],
  ["text carries the binding line", coText.includes("part of the original agreement when signed")],
  ["text carries price, schedule, approval", coText.includes("Price change: $450.00 add") && coText.includes("+1 day") && coText.includes("Approved by Pat Customer on 2026-09-06")],
  ["text has no em dash", !coText.includes("\u2014")],
]
for (const [name, pass] of coCases) {
  console.log(`${pass ? "PASS" : "FAIL"} co: ${name}`)
  ok &&= pass
}

// ---- photo stamper (photo-stamp.ts) ----
const { stampLines, fmtCoord, jobSlug, photoFilename, zipFilename } = await import("../components/housecalls/photo-stamp.ts")
const when = new Date(2026, 8, 7, 14, 5) // local time, Sep 7 14:05
const psCases = [
  ["stamp carries job, local time, coords", JSON.stringify(stampLines("Smith - 123 Main St", when, { lat: 42.96116, lon: -85.65557 })) === JSON.stringify(["Smith - 123 Main St", "2026-09-07 14:05", "42.96116, -85.65557"])],
  ["no gps means no coord line, still stamped", stampLines("Job", when, { lat: null, lon: null }).length === 2],
  ["no job label still stamps the time", stampLines("  ", when, { lat: null, lon: null }).length === 1],
  ["coords are 5 decimals", fmtCoord(42.9611600001, -85.65557) === "42.96116, -85.65557"],
  ["job slug is filesystem-safe", jobSlug("Smith / 123 Main St. #2") === "smith-123-main-st-2" && jobSlug("!!!") === "job"],
  ["filenames sort by time and sequence", photoFilename("Smith Job", "2026-09-07T14:05:33.000Z", 3) === "smith-job-202609071405-03.jpg"],
  ["zip named for the job", zipFilename("Smith / Main") === "smith-main-photos.zip"],
]
for (const [name, pass] of psCases) {
  console.log(`${pass ? "PASS" : "FAIL"} photos: ${name}`)
  ok &&= pass
}

// ---- material pad parser (material-parse.ts) ----
const { parseChunk, parseTranscript, itemLine, listAsText } = await import("../components/housecalls/material-parse.ts")
const spoken = "uh I need three boxes of romex twelve two and um twenty feet of half inch EMT and a roll of electrical tape then two GFCI outlets"
const items = parseTranscript(spoken)
const lines = items.map(itemLine)
const mpCases = [
  ["four items out of one ramble", items.length === 4],
  ["boxes of romex with wire pair joined", lines[0] === "3 box romex 12-2"],
  ["feet + fraction-inch size formatted", lines[1] === "20 ft 1/2\" EMT"],
  ["a roll means qty 1 roll", lines[2] === "1 roll electrical tape"],
  ["acronyms come back uppercase", lines[3] === "2x GFCI outlets"],
  ["three quarters becomes 3/4 inch mark", itemLine(parseChunk("ten sticks of three quarter inch PVC")) === "10 stick 3/4\" PVC"],
  ["tens plus units compose", parseChunk("twenty five wire nuts").qty === 25],
  ["a dozen is twelve", parseChunk("a dozen wedge anchors").qty === 12],
  ["plain typed lines parse too", itemLine(parseChunk("4 sheets 5/8 drywall")) === "4 sheet 5/8 drywall"],
  ["noise parses to nothing", parseTranscript("um uh okay so like").length === 0],
  ["list text carries the job and the credit line", (() => { const t = listAsText("Smith job", items); return t.startsWith("MATERIAL LIST · Smith job") && t.includes("housecalls.bradley.io") })()],
]
for (const [name, pass] of mpCases) {
  console.log(`${pass ? "PASS" : "FAIL"} materials: ${name}`)
  ok &&= pass
}

process.exit(ok ? 0 : 1)
