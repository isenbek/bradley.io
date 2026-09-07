#!/usr/bin/env node
/**
 * Money-math selftests for the truck quote pad. A quote a tradesperson
 * hands a customer must never say $0.30000000000000004; cents-internal
 * math is the guarantee and these are its proof.
 *
 * quote-math.ts is TypeScript; node 24 strips types natively.
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
process.exit(ok ? 0 : 1)
