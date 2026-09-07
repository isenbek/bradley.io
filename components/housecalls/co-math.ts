/**
 * Change-order pad math and text (docs/housecalls/truck-pad-plan.md's
 * sibling; selftested in scripts/housecalls-quote-selftest.mjs). Reuses the
 * quote pad's cents-internal money; adds the one thing a change order has
 * that a quote does not: a signed direction (an add or a deduct).
 */

import { toCents, money } from "./quote-math"

export type ChangeMode = "add" | "deduct"

/** Signed cents: positive for adds, negative for deducts. */
export const signedCents = (amount: string, mode: ChangeMode): number =>
  (mode === "deduct" ? -1 : 1) * toCents(amount)

export const signedMoney = (cents: number): string =>
  cents < 0 ? `(${money(-cents)}) deduct` : `${money(cents)} add`

/** CO number a human can say on the phone: date plus a short counter. */
export const coNumber = (now: Date, seq: number): string =>
  `CO-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${String(seq).padStart(2, "0")}`

export interface ChangeOrder {
  co_number: string
  customer: string
  address: string
  job_ref: string
  description: string
  reason: string
  amount: string
  mode: ChangeMode
  days: string
  signed_name: string
  signed_date: string
}

/** The text form, for texting the change from the driveway. */
export function changeAsText(shop: Record<string, string>, co: ChangeOrder): string {
  const lines: string[] = []
  lines.push(`CHANGE ORDER ${co.co_number} from ${shop.name || "(your shop)"}`)
  if (shop.phone || shop.email) lines.push([shop.phone, shop.email].filter(Boolean).join(" · "))
  if (shop.license) lines.push(`License ${shop.license}`)
  lines.push("")
  if (co.customer) lines.push(`For: ${co.customer}`)
  if (co.address) lines.push(`Job: ${co.address}`)
  if (co.job_ref) lines.push(`Original quote/job: ${co.job_ref}`)
  lines.push("")
  lines.push(`Change: ${co.description || "(describe the change)"}`)
  if (co.reason) lines.push(`Why: ${co.reason}`)
  const cents = signedCents(co.amount, co.mode)
  if (cents !== 0) lines.push(`Price change: ${signedMoney(cents)}`)
  const d = Number(co.days)
  if (Number.isFinite(d) && d > 0) lines.push(`Schedule impact: +${d} day${d === 1 ? "" : "s"}`)
  lines.push("")
  lines.push("This change becomes part of the original agreement when signed.")
  if (co.signed_name) lines.push(`Approved by ${co.signed_name} on ${co.signed_date}`)
  return lines.join("\n")
}
