"use client"

import { useEffect, useRef, useState } from "react"
import { type ChangeOrder, changeAsText, coNumber, signedCents, signedMoney } from "./co-math"
import { SignaturePad } from "./SignaturePad"

/**
 * The change-order pad: second House Calls giveaway. Scope change + photo +
 * signature on the phone, one printable page, signed BEFORE the work
 * happens, because unpaid change orders are money every tradesperson has
 * lost. Shares the quote pad's shop profile (hc-quote-shop): set your shop
 * once and every tool on the shelf knows you.
 *
 * Photos are downscaled on-device (max 1280px, JPEG) before storage so
 * three of them fit comfortably in localStorage; nothing uploads anywhere,
 * same as everything on this shelf.
 */

interface Shop {
  name: string
  phone: string
  email: string
  city: string
  license: string
  insured: string
  terms: string
  [key: string]: string
}

interface Draft extends ChangeOrder {
  photos: string[]
  signature: string | null
  seq: number
}

const BLANK_SHOP: Shop = { name: "", phone: "", email: "", city: "", license: "", insured: "", terms: "" }

const blankDraft = (seq: number): Draft => ({
  co_number: coNumber(new Date(), seq),
  customer: "", address: "", job_ref: "", description: "", reason: "",
  amount: "", mode: "add", days: "",
  signed_name: "", signed_date: new Date().toISOString().slice(0, 10),
  photos: [], signature: null, seq,
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
    /* full or blocked store forgets; it never breaks the pad */
  }
}

/** Downscale a photo on-device: longest side 1280, JPEG. */
async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.7)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function F({ label, value, onChange, wide, type }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; type?: string }) {
  return (
    <label className={`beta-qp-field${wide ? " beta-qp-field--wide" : ""}`}>
      <span>{label}</span>
      <input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function ChangeOrderPad() {
  const [shop, setShop] = useState<Shop>(BLANK_SHOP)
  const [draft, setDraft] = useState<Draft>(() => blankDraft(1))
  const [ready, setReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    setShop(load("hc-quote-shop", BLANK_SHOP))
    setDraft(load("hc-co-draft", blankDraft(1)))
    hydrated.current = true
    setReady(true)
  }, [])
  useEffect(() => {
    if (hydrated.current) save("hc-co-draft", draft)
  }, [draft])

  const cents = signedCents(draft.amount, draft.mode)

  const addPhotos = async (files: FileList | null) => {
    if (!files) return
    const room = 3 - draft.photos.length
    const shrunk: string[] = []
    for (const f of Array.from(files).slice(0, room)) {
      try {
        shrunk.push(await shrinkPhoto(f))
      } catch {
        /* an unreadable photo is skipped, never fatal */
      }
    }
    if (shrunk.length) setDraft((d) => ({ ...d, photos: [...d.photos, ...shrunk].slice(0, 3) }))
  }

  const asText = () => changeAsText(shop as unknown as Record<string, string>, draft)
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
    if (!confirm("Start a new change order? The current one is cleared.")) return
    setDraft(blankDraft(draft.seq + 1))
  }

  if (!ready) return <p className="beta-chart__note">Opening the pad…</p>

  return (
    <div className="beta-qp">
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>{draft.co_number}</b>
            <button className="btn" onClick={startNew}>New change order</button>
          </div>
          {!shop.name ? (
            <p className="beta-qp-shopline">
              Tip: set your shop once in the <a href="/housecalls/tools/quote">quote pad</a> and
              every tool on this shelf uses it.
            </p>
          ) : null}
          <div className="beta-qp-grid">
            <F label="Customer" value={draft.customer} onChange={(v) => setDraft({ ...draft, customer: v })} />
            <F label="Job address" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
            <F label="Original quote or job #" value={draft.job_ref} onChange={(v) => setDraft({ ...draft, job_ref: v })} />
            <F label="Schedule impact (days)" value={draft.days} onChange={(v) => setDraft({ ...draft, days: v })} type="number" />
            <F label="What changed" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} wide />
            <F label="Why (what was found)" value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} wide />
          </div>

          <div className="beta-co-amount">
            <label className="beta-qp-field">
              <span>Price change</span>
              <input inputMode="decimal" placeholder="$ amount" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
            </label>
            <div className="beta-co-mode" role="group" aria-label="Add or deduct">
              <button className={`btn${draft.mode === "add" ? " btn-primary" : ""}`} onClick={() => setDraft({ ...draft, mode: "add" })}>Add</button>
              <button className={`btn${draft.mode === "deduct" ? " btn-primary" : ""}`} onClick={() => setDraft({ ...draft, mode: "deduct" })}>Deduct</button>
            </div>
            <span className="beta-qp-item__ext num">{cents !== 0 ? signedMoney(cents) : ""}</span>
          </div>

          <div className="beta-co-photos">
            {draft.photos.map((p, i) => (
              <span className="beta-co-photo" key={i}>
                <img src={p} alt={`Job photo ${i + 1}`} />
                <button aria-label="Remove photo" onClick={() => setDraft((d) => ({ ...d, photos: d.photos.filter((_, j) => j !== i) }))}>×</button>
              </span>
            ))}
            {draft.photos.length < 3 ? (
              <button className="btn" onClick={() => fileRef.current?.click()}>+ Photo ({draft.photos.length}/3)</button>
            ) : null}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Customer approval</b>
            <span>sign before the work, not after</span>
          </div>
          <div className="beta-qp-grid">
            <F label="Approved by (print name)" value={draft.signed_name} onChange={(v) => setDraft({ ...draft, signed_name: v })} />
            <F label="Date" value={draft.signed_date} onChange={(v) => setDraft({ ...draft, signed_date: v })} type="date" />
          </div>
          <SignaturePad key={draft.co_number} initial={draft.signature} onChange={(sig) => setDraft((d) => ({ ...d, signature: sig }))} />
          <p className="beta-qp-shopline">This change becomes part of the original agreement when signed.</p>
          <p className="hero-ctas beta-qp-actions">
            <button className="btn btn-primary" onClick={() => window.print()}>Print / PDF</button>
            <button className="btn" onClick={copy}>{copied ? "Copied" : "Copy as text"}</button>
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <button className="btn" onClick={share}>Share</button>
            ) : null}
          </p>
        </div>
      </div>

      {/* ---- printable sheet ---- */}
      <div className="beta-qp-sheet" aria-hidden="true">
        <div className="beta-qp-sheet__head">
          <h1>{shop.name || "Change Order"}</h1>
          <p>
            {[shop.city, shop.phone, shop.email].filter(Boolean).join(" · ")}
            {shop.license ? <><br />License {shop.license}</> : null}
            {shop.insured ? <><br />{shop.insured}</> : null}
          </p>
        </div>
        <table className="beta-qp-sheet__meta">
          <tbody>
            <tr><td>Change order</td><td>{draft.co_number}</td></tr>
            {draft.customer ? <tr><td>For</td><td>{draft.customer}</td></tr> : null}
            {draft.address ? <tr><td>Job</td><td>{draft.address}</td></tr> : null}
            {draft.job_ref ? <tr><td>Original</td><td>{draft.job_ref}</td></tr> : null}
            <tr><td>Change</td><td>{draft.description}</td></tr>
            {draft.reason ? <tr><td>Reason</td><td>{draft.reason}</td></tr> : null}
            {cents !== 0 ? <tr><td>Price change</td><td>{signedMoney(cents)}</td></tr> : null}
            {Number(draft.days) > 0 ? <tr><td>Schedule</td><td>+{draft.days} days</td></tr> : null}
          </tbody>
        </table>
        {draft.photos.length ? (
          <div className="beta-qp-sheet__photos">
            {draft.photos.map((p, i) => (
              <img key={i} src={p} alt={`Job photo ${i + 1}`} />
            ))}
          </div>
        ) : null}
        <div className="beta-qp-sheet__foot">
          <p>This change becomes part of the original agreement when signed.</p>
          {shop.terms ? <p>{shop.terms}</p> : null}
          <div className="beta-qp-sheet__sigrow">
            {draft.signature ? (
              <img src={draft.signature} alt="Customer signature" />
            ) : (
              <span className="beta-qp-sheet__sig">Signature: ______________________________</span>
            )}
            <span>
              {draft.signed_name || "______________________"} · {draft.signed_date}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
