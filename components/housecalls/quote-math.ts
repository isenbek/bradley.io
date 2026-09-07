/**
 * The truck quote pad's money math, pure and selftested
 * (scripts/housecalls-quote-selftest.mjs). Money moves in CENTS internally;
 * dollars only at the edges, so 0.1 + 0.2 can never appear on a quote.
 */

export interface LineItem {
  desc: string
  qty: string // raw field values; parsing is the math's job
  unit: string
}

export const toCents = (raw: string): number => {
  const n = Number(String(raw).replace(/[$,\s]/g, ""))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

export const parseQty = (raw: string): number => {
  const n = Number(String(raw).replace(/[,\s]/g, ""))
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

export const money = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })

export const lineTotal = (item: LineItem): number => Math.round(parseQty(item.qty) * toCents(item.unit))

export const quoteTotal = (items: LineItem[]): number => items.reduce((sum, it) => sum + lineTotal(it), 0)

export const depositCents = (total: number, pct: string): number => {
  const p = Number(pct)
  if (!Number.isFinite(p) || p <= 0) return 0
  return Math.round((total * Math.min(p, 100)) / 100)
}

export const validUntil = (fromISO: string, days: string): string => {
  const d = new Date(fromISO)
  const n = Number(days)
  d.setDate(d.getDate() + (Number.isFinite(n) && n > 0 ? Math.min(n, 365) : 14))
  return d.toISOString().slice(0, 10)
}

/** The text form, for texting a quote from the truck. Plain, no markup. */
export function quoteAsText(shop: Record<string, string>, q: { customer: string; address: string; scope: string; exclusions: string; notes: string; deposit_pct: string; valid_until: string; items: LineItem[] }): string {
  const lines: string[] = []
  lines.push(`QUOTE from ${shop.name || "(your shop)"}${shop.city ? `, ${shop.city}` : ""}`)
  if (shop.phone || shop.email) lines.push([shop.phone, shop.email].filter(Boolean).join(" · "))
  if (shop.license) lines.push(`License ${shop.license}`)
  lines.push("")
  if (q.customer) lines.push(`For: ${q.customer}`)
  if (q.address) lines.push(`Job: ${q.address}`)
  if (q.scope) lines.push(`Scope: ${q.scope}`)
  lines.push("")
  for (const it of q.items) {
    if (!it.desc && lineTotal(it) === 0) continue
    lines.push(`${it.desc || "(item)"}  ${parseQty(it.qty) || 1} x ${money(toCents(it.unit))} = ${money(lineTotal(it))}`)
  }
  const total = quoteTotal(q.items)
  lines.push(`TOTAL: ${money(total)}`)
  const dep = depositCents(total, q.deposit_pct)
  if (dep > 0) lines.push(`Deposit to schedule: ${money(dep)} (${q.deposit_pct}%)`)
  if (q.valid_until) lines.push(`Price good through ${q.valid_until}`)
  if (q.exclusions) lines.push(`Not included: ${q.exclusions}`)
  if (q.notes) lines.push(`Notes: ${q.notes}`)
  if (shop.insured) lines.push(shop.insured)
  if (shop.terms) lines.push(shop.terms)
  return lines.join("\n")
}
