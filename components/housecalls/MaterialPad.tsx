"use client"

import { useEffect, useRef, useState } from "react"
import { type MaterialItem, listAsText, parseTranscript } from "./material-parse"

/**
 * The voice material pad: fourth and last shortlist giveaway. Talk the
 * list in the truck (or type it), get a clean list to text, print, or
 * hand across the counter. The mic is the browser's own speech service;
 * the turning-words-into-a-list part is deterministic rules on this page,
 * not a model, and the fine print says so with the honest-AI letter's own
 * sentence. Draft persists locally; nothing uploads.
 */

interface Draft {
  job: string
  transcript: string
  items: MaterialItem[]
}

const BLANK: Draft = { job: "", transcript: "", items: [] }

const load = (): Draft => {
  try {
    const raw = localStorage.getItem("hc-materials-draft")
    return raw ? { ...BLANK, ...JSON.parse(raw) } : BLANK
  } catch {
    return BLANK
  }
}

export function MaterialPad() {
  const [draft, setDraft] = useState<Draft>(BLANK)
  const [ready, setReady] = useState(false)
  const [listening, setListening] = useState(false)
  const [micAvailable, setMicAvailable] = useState(false)
  const [copied, setCopied] = useState(false)
  const recRef = useRef<{ stop: () => void } | null>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    setDraft(load())
    const w = window as unknown as Record<string, unknown>
    setMicAvailable(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition))
    hydrated.current = true
    setReady(true)
  }, [])
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem("hc-materials-draft", JSON.stringify(draft))
    } catch {
      /* blocked storage forgets the draft; the pad still works */
    }
  }, [draft])

  const startMic = () => {
    const w = window as unknown as Record<string, unknown>
    const Rec = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
      | (new () => {
          continuous: boolean
          interimResults: boolean
          lang: string
          onresult: (e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void
          onend: () => void
          onerror: () => void
          start: () => void
          stop: () => void
        })
      | undefined
    if (!Rec) return
    const rec = new Rec()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = "en-US"
    rec.onresult = (e) => {
      let heard = ""
      for (let i = e.resultIndex; i < (e.results as unknown as { length: number }).length; i++) {
        const r = e.results[i]
        if (r.isFinal) heard += r[0].transcript + " "
      }
      if (heard.trim()) {
        setDraft((d) => ({ ...d, transcript: `${d.transcript} ${heard}`.replace(/\s+/g, " ").trimStart() }))
      }
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }
  const stopMic = () => {
    recRef.current?.stop()
    setListening(false)
  }

  const parse = () => {
    const items = parseTranscript(draft.transcript)
    setDraft((d) => ({ ...d, items }))
  }
  const setItem = (i: number, patch: Partial<MaterialItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }))
  const dropItem = (i: number) => setDraft((d) => ({ ...d, items: d.items.filter((_, j) => j !== i) }))
  const addItem = () => setDraft((d) => ({ ...d, items: [...d.items, { qty: 1, unit: null, desc: "" }] }))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(listAsText(draft.job, draft.items))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked; print still works */
    }
  }
  const share = async () => {
    try {
      await navigator.share({ text: listAsText(draft.job, draft.items) })
    } catch {
      /* cancelled or unsupported */
    }
  }
  const startNew = () => {
    if (!confirm("Clear the list and the transcript?")) return
    setDraft({ ...BLANK, job: draft.job })
  }

  if (!ready) return <p className="beta-chart__note">Opening the pad…</p>

  return (
    <div className="beta-qp">
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Say the list</b>
            <button className="btn" onClick={startNew}>Clear</button>
          </div>
          <div className="beta-qp-grid">
            <label className="beta-qp-field beta-qp-field--wide">
              <span>Job (goes on the printed list)</span>
              <input value={draft.job} onChange={(e) => setDraft({ ...draft, job: e.target.value })} placeholder="Smith - 123 Main St" />
            </label>
            <label className="beta-qp-field beta-qp-field--wide">
              <span>The ramble (talk it or type it; "and" separates items)</span>
              <textarea
                className="beta-mp-transcript"
                rows={4}
                value={draft.transcript}
                onChange={(e) => setDraft({ ...draft, transcript: e.target.value })}
                placeholder="three boxes of romex twelve two and twenty feet of half inch EMT and a roll of electrical tape"
              />
            </label>
          </div>
          <p className="hero-ctas beta-qp-actions">
            {micAvailable ? (
              <button className={`btn${listening ? " btn-primary" : ""}`} onClick={listening ? stopMic : startMic}>
                {listening ? "■ Stop listening" : "🎙 Talk"}
              </button>
            ) : null}
            <button className="btn btn-primary" onClick={parse} disabled={!draft.transcript.trim()}>
              Make the list
            </button>
          </p>
        </div>
      </div>

      {draft.items.length ? (
        <div className="panel">
          <div className="panel-face">
            <div className="panel-bar">
              <b>The list</b>
              <span>{draft.items.length} item{draft.items.length === 1 ? "" : "s"}</span>
            </div>
            <div className="beta-qp-items">
              {draft.items.map((it, i) => (
                <div className="beta-mp-item" key={i}>
                  <input className="beta-mp-item__qty" inputMode="decimal" value={String(it.qty)} onChange={(e) => setItem(i, { qty: Number(e.target.value) || 0 })} aria-label="Quantity" />
                  <input className="beta-mp-item__unit" value={it.unit ?? ""} onChange={(e) => setItem(i, { unit: e.target.value || null })} placeholder="unit" aria-label="Unit" />
                  <input className="beta-mp-item__desc" value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} aria-label="Item" />
                  <button className="beta-qp-item__x" onClick={() => dropItem(i)} aria-label="Remove line">×</button>
                </div>
              ))}
              <button className="btn" onClick={addItem}>+ Add line</button>
            </div>
            <p className="hero-ctas beta-qp-actions">
              <button className="btn btn-primary" onClick={() => window.print()}>Print</button>
              <button className="btn" onClick={copy}>{copied ? "Copied" : "Copy as text"}</button>
              {typeof navigator !== "undefined" && "share" in navigator ? (
                <button className="btn" onClick={share}>Share</button>
              ) : null}
            </p>
          </div>
        </div>
      ) : null}

      {/* printable sheet */}
      <div className="beta-qp-sheet" aria-hidden="true">
        <div className="beta-qp-sheet__head">
          <h1>Material list</h1>
          <p>
            {draft.job || ""}
            {draft.job ? <br /> : null}
            {new Date().toISOString().slice(0, 10)}
          </p>
        </div>
        <table className="beta-qp-sheet__items">
          <thead>
            <tr><th>Qty</th><th>Unit</th><th>Item</th><th>Got it</th></tr>
          </thead>
          <tbody>
            {draft.items.map((it, i) => (
              <tr key={i}>
                <td>{it.qty}</td>
                <td>{it.unit ?? ""}</td>
                <td>{it.desc}</td>
                <td>☐</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="beta-qp-sheet__foot">
          <p>made with the free pad at housecalls.bradley.io</p>
        </div>
      </div>
    </div>
  )
}
