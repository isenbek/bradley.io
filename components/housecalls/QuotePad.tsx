"use client"

import { useEffect, useRef, useState } from "react"
import {
  type LineItem,
  depositCents,
  lineTotal,
  money,
  quoteAsText,
  quoteTotal,
  toCents,
  validUntil,
} from "./quote-math"

/** Hoisted so its identity is stable across renders; defining a component
 *  inside the render function remounts the input on every keystroke and
 *  drops focus. */
function F({ label, value, onChange, wide, type }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; type?: string }) {
  return (
    <label className={`beta-qp-field${wide ? " beta-qp-field--wide" : ""}`}>
      <span>{label}</span>
      <input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

/**
 * The truck quote pad: the first House Calls giveaway
 * (docs/housecalls/truck-pad-plan.md). Free, no account, no signup, and
 * nothing ever leaves the phone: shop profile and the working quote live in
 * localStorage, wrapped in try/catch so a blocked store still yields a
 * working pad (it just forgets between visits).
 *
 * Out the door three ways: print (the print CSS in app/kit.css hides the
 * site and shows the sheet), copy-as-text for texting, Web Share where the
 * phone offers it.
 */

interface Shop {
  name: string
  phone: string
  email: string
  city: string
  license: string
  insured: string
  deposit_pct: string
  valid_days: string
  terms: string
  [key: string]: string
}

interface Quote {
  customer: string
  address: string
  scope: string
  exclusions: string
  notes: string
  deposit_pct: string
  valid_until: string
  items: LineItem[]
}

const BLANK_SHOP: Shop = {
  name: "", phone: "", email: "", city: "", license: "",
  insured: "", deposit_pct: "25", valid_days: "14", terms: "",
}

const blankQuote = (shop: Shop): Quote => ({
  customer: "", address: "", scope: "", exclusions: "", notes: "",
  deposit_pct: shop.deposit_pct || "25",
  valid_until: validUntil(new Date().toISOString(), shop.valid_days),
  items: [{ desc: "", qty: "1", unit: "" }],
})

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}
const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* a blocked store forgets; it never breaks */
  }
}

export function QuotePad() {
  const [shop, setShop] = useState<Shop>(BLANK_SHOP)
  const [quote, setQuote] = useState<Quote>(() => blankQuote(BLANK_SHOP))
  const [ready, setReady] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    const s = load("hc-quote-shop", BLANK_SHOP)
    setShop(s)
    setQuote(load("hc-quote-draft", blankQuote(s)))
    setShopOpen(!s.name)
    hydrated.current = true
    setReady(true)
  }, [])
  useEffect(() => {
    if (hydrated.current) save("hc-quote-shop", shop)
  }, [shop])
  useEffect(() => {
    if (hydrated.current) save("hc-quote-draft", quote)
  }, [quote])

  const total = quoteTotal(quote.items)
  const deposit = depositCents(total, quote.deposit_pct)

  const setItem = (i: number, patch: Partial<LineItem>) =>
    setQuote((q) => ({ ...q, items: q.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }))
  const addItem = () => setQuote((q) => ({ ...q, items: [...q.items, { desc: "", qty: "1", unit: "" }] }))
  const dropItem = (i: number) =>
    setQuote((q) => ({ ...q, items: q.items.length > 1 ? q.items.filter((_, j) => j !== i) : q.items }))

  const asText = () => quoteAsText(shop as unknown as Record<string, string>, quote)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the print path still works */
    }
  }
  const share = async () => {
    try {
      await navigator.share({ text: asText() })
    } catch {
      /* user cancelled or unsupported */
    }
  }
  const startNew = () => {
    if (!confirm("Start a new quote? The current one is cleared.")) return
    setQuote(blankQuote(shop))
  }

  if (!ready) return <p className="beta-chart__note">Opening the pad…</p>

  return (
    <div className="beta-qp">
      {/* ---- the shop, saved on the phone ---- */}
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Your shop</b>
            <button className="btn" onClick={() => setShopOpen((v) => !v)}>
              {shopOpen ? "Done" : shop.name ? "Edit" : "Set up"}
            </button>
          </div>
          {shopOpen ? (
            <div className="beta-qp-grid">
              <F label="Business name" value={shop.name} onChange={(v) => setShop({ ...shop, name: v })} wide />
              <F label="Phone" value={shop.phone} onChange={(v) => setShop({ ...shop, phone: v })} />
              <F label="Email" value={shop.email} onChange={(v) => setShop({ ...shop, email: v })} />
              <F label="City" value={shop.city} onChange={(v) => setShop({ ...shop, city: v })} />
              <F label="License #" value={shop.license} onChange={(v) => setShop({ ...shop, license: v })} />
              <F label="Insurance line (e.g. Licensed and insured)" value={shop.insured} onChange={(v) => setShop({ ...shop, insured: v })} wide />
              <F label="Default deposit %" value={shop.deposit_pct} onChange={(v) => setShop({ ...shop, deposit_pct: v })} type="number" />
              <F label="Quote good for (days)" value={shop.valid_days} onChange={(v) => setShop({ ...shop, valid_days: v })} type="number" />
              <F label="Standard terms line" value={shop.terms} onChange={(v) => setShop({ ...shop, terms: v })} wide />
            </div>
          ) : (
            <p className="beta-qp-shopline">
              {shop.name ? `${shop.name}${shop.city ? ` · ${shop.city}` : ""}${shop.license ? ` · Lic ${shop.license}` : ""}` : "Set your shop once; it stays on this phone."}
            </p>
          )}
        </div>
      </div>

      {/* ---- the quote ---- */}
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>This quote</b>
            <button className="btn" onClick={startNew}>New quote</button>
          </div>
          <div className="beta-qp-grid">
            <F label="Customer" value={quote.customer} onChange={(v) => setQuote({ ...quote, customer: v })} />
            <F label="Job address" value={quote.address} onChange={(v) => setQuote({ ...quote, address: v })} />
            <F label="Scope of work" value={quote.scope} onChange={(v) => setQuote({ ...quote, scope: v })} wide />
          </div>

          <div className="beta-qp-items">
            {quote.items.map((it, i) => (
              <div className="beta-qp-item" key={i}>
                <input className="beta-qp-item__desc" placeholder="Item or labor" value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} />
                <input className="beta-qp-item__qty" inputMode="decimal" placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} />
                <input className="beta-qp-item__unit" inputMode="decimal" placeholder="$ each" value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} />
                <span className="beta-qp-item__ext num">{money(lineTotal(it))}</span>
                <button className="beta-qp-item__x" onClick={() => dropItem(i)} aria-label="Remove line">×</button>
              </div>
            ))}
            <button className="btn" onClick={addItem}>+ Add line</button>
          </div>

          <div className="beta-qp-grid">
            <F label="Deposit %" value={quote.deposit_pct} onChange={(v) => setQuote({ ...quote, deposit_pct: v })} type="number" />
            <F label="Price good through" value={quote.valid_until} onChange={(v) => setQuote({ ...quote, valid_until: v })} type="date" />
            <F label="Not included" value={quote.exclusions} onChange={(v) => setQuote({ ...quote, exclusions: v })} wide />
            <F label="Notes" value={quote.notes} onChange={(v) => setQuote({ ...quote, notes: v })} wide />
          </div>

          <table className="readout">
            <tbody>
              <tr><td>Total</td><td className="num">{money(total)}</td></tr>
              {deposit > 0 ? (
                <tr><td>Deposit to schedule ({quote.deposit_pct}%)</td><td className="num">{money(deposit)}</td></tr>
              ) : null}
            </tbody>
          </table>

          <p className="hero-ctas beta-qp-actions">
            <button className="btn btn-primary" onClick={() => window.print()}>Print / PDF</button>
            <button className="btn" onClick={copy}>{copied ? "Copied" : "Copy as text"}</button>
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <button className="btn" onClick={share}>Share</button>
            ) : null}
          </p>
        </div>
      </div>

      {/* ---- the printable sheet (visible only in print) ---- */}
      <div className="beta-qp-sheet" aria-hidden="true">
        <div className="beta-qp-sheet__head">
          <h1>{shop.name || "Quote"}</h1>
          <p>
            {[shop.city, shop.phone, shop.email].filter(Boolean).join(" · ")}
            {shop.license ? <><br />License {shop.license}</> : null}
            {shop.insured ? <><br />{shop.insured}</> : null}
          </p>
        </div>
        <table className="beta-qp-sheet__meta">
          <tbody>
            {quote.customer ? <tr><td>For</td><td>{quote.customer}</td></tr> : null}
            {quote.address ? <tr><td>Job</td><td>{quote.address}</td></tr> : null}
            {quote.scope ? <tr><td>Scope</td><td>{quote.scope}</td></tr> : null}
            <tr><td>Date</td><td>{new Date().toISOString().slice(0, 10)}</td></tr>
          </tbody>
        </table>
        <table className="beta-qp-sheet__items">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Each</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {quote.items.filter((it) => it.desc || lineTotal(it) > 0).map((it, i) => (
              <tr key={i}>
                <td>{it.desc}</td>
                <td>{it.qty}</td>
                <td>{money(toCents(it.unit))}</td>
                <td>{money(lineTotal(it))}</td>
              </tr>
            ))}
            <tr className="beta-qp-sheet__total">
              <td colSpan={3}>Total</td>
              <td>{money(total)}</td>
            </tr>
            {deposit > 0 ? (
              <tr>
                <td colSpan={3}>Deposit to schedule ({quote.deposit_pct}%)</td>
                <td>{money(deposit)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="beta-qp-sheet__foot">
          {quote.exclusions ? <p>Not included: {quote.exclusions}</p> : null}
          {quote.notes ? <p>Notes: {quote.notes}</p> : null}
          <p>Price good through {quote.valid_until}.</p>
          {shop.terms ? <p>{shop.terms}</p> : null}
          <p className="beta-qp-sheet__sig">Accepted by: ______________________________ Date: ______________</p>
        </div>
      </div>
    </div>
  )
}
