"use client"

import { useState } from "react"
import { loadHarness, stashPull, stashPut, type Harness } from "@/lib/housecalls/harness-client"

/**
 * History & backup (beta): the shelf's harness surface
 * (docs/housecalls/local-harness-plan.md P3). Everything stays optional:
 * the tools above work forever without touching this. Activation loads the
 * local engine (sizes stated honestly), imports what the tool already
 * holds, and offers the wallet flow: twelve words shown once, backup as
 * ciphertext, restore by typing the words on any device.
 */

type Stage = "idle" | "loading" | "ready"

export function BackupPanel() {
  const [stage, setStage] = useState<Stage>("idle")
  const [steps, setSteps] = useState<string[]>([])
  const [h, setH] = useState<Harness | null>(null)
  const [counts, setCounts] = useState<{ quotes: number; change_orders: number } | null>(null)
  const [quotes, setQuotes] = useState<Record<string, unknown>[]>([])
  const [words, setWords] = useState<string | null>(null)
  const [wordsConfirmed, setWordsConfirmed] = useState(false)
  const [vault, setVault] = useState<unknown | null>(null)
  const [restoreWords, setRestoreWords] = useState("")
  const [busy, setBusy] = useState("")
  const [note, setNote] = useState("")

  const refresh = async (hh: Harness) => {
    setCounts(await hh.counts())
    setQuotes(await hh.query("list_quotes"))
  }

  const activate = async () => {
    setStage("loading")
    try {
      const hh = await loadHarness((m) => setSteps((s) => [...s, m]))
      const { imported } = await hh.importFromLocalStorage()
      setH(hh)
      await refresh(hh)
      setNote(imported.length ? `Brought in: ${imported.join(", ")}.` : "")
      setStage("ready")
    } catch (e) {
      setSteps((s) => [...s, `Could not start: ${e instanceof Error ? e.message : String(e)}`])
      setStage("idle")
    }
  }

  const makeWords = () => {
    if (!h) return
    setWords(h.engine.generate_seed())
    setWordsConfirmed(false)
  }

  const printCard = () => {
    if (!words) return
    const w = window.open("", "_blank", "width=600,height=400")
    if (!w) return
    w.document.write(
      `<title>House Calls backup words</title><body style="font-family:Georgia,serif;padding:24px">` +
        `<h2 style="margin:0 0 4px">Backup words</h2>` +
        `<p style="margin:0 0 16px;font-size:12px">These twelve words ARE the backup. Anyone with them can read it; nobody without them can, including us. Keep this card somewhere that is not the phone.</p>` +
        `<p style="font-size:20px;line-height:1.8;border:2px solid #000;padding:12px">${words}</p>` +
        `<p style="font-size:11px">housecalls.bradley.io · free tools for the trades</p></body>`
    )
    w.document.close()
    w.print()
  }

  const unlock = async (phrase: string): Promise<unknown> => {
    if (!h) throw new Error("harness not ready")
    setBusy("Deriving your key (about a second)")
    try {
      const v = new h.engine.Vault(phrase)
      setVault(v)
      return v
    } finally {
      setBusy("")
    }
  }

  const backup = async () => {
    if (!h) return
    try {
      const v = vault ?? (words && wordsConfirmed ? await unlock(words) : null)
      if (!v) {
        setNote("Create your backup words first, and confirm you wrote them down.")
        return
      }
      setBusy("Encrypting and sending ciphertext")
      const { version } = await stashPut(h, v)
      setNote(`Backed up (version ${version}). What left this phone is ciphertext.`)
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy("")
    }
  }

  const restore = async () => {
    if (!h || !restoreWords.trim()) return
    try {
      const v = await unlock(restoreWords)
      setBusy("Fetching and decrypting your backup")
      const { version } = await stashPull(h, v)
      await refresh(h)
      setNote(`Restored backup version ${version} onto this device.`)
      setRestoreWords("")
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="panel">
      <div className="panel-face">
        <div className="panel-bar">
          <b>History &amp; backup</b>
          <span className="tag">beta</span>
        </div>

        {stage === "idle" ? (
          <div className="beta-qp-grid">
            <p className="beta-qp-shopline beta-qp-field--wide">
              Optional, and the pad above never needs it: a real database on your phone for quote
              history, plus backup as a twelve-word code, like a crypto wallet. First activation
              downloads about 8MB, once; after that it lives on your device. No account, ever.
            </p>
            <p className="beta-qp-field--wide">
              <button className="btn" onClick={activate}>Turn on history &amp; backup</button>
            </p>
            {steps.map((s, i) => (
              <p className="beta-qp-shopline beta-qp-field--wide" key={i}>{s}</p>
            ))}
          </div>
        ) : null}

        {stage === "loading" ? (
          <div>
            {steps.map((s, i) => (
              <p className="beta-qp-shopline" key={i}>{s}…</p>
            ))}
          </div>
        ) : null}

        {stage === "ready" && h ? (
          <div className="beta-qp-grid">
            <p className="beta-qp-shopline beta-qp-field--wide">
              On this device: {counts?.quotes ?? 0} quote{counts?.quotes === 1 ? "" : "s"},{" "}
              {counts?.change_orders ?? 0} change order{counts?.change_orders === 1 ? "" : "s"}.
              {note ? ` ${note}` : ""}
              {busy ? ` ${busy}…` : ""}
            </p>

            {quotes.length ? (
              <table className="readout beta-qp-field--wide">
                <tbody>
                  {quotes.slice(0, 8).map((q, i) => (
                    <tr key={i}>
                      <td>{String(q.created_at).slice(0, 10)} · {String(q.customer || "(no name)")}</td>
                      <td className="num">${(Number(q.total_cents) / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {!words && !vault ? (
              <p className="beta-qp-field--wide">
                <button className="btn btn-primary" onClick={makeWords}>Create backup words</button>
              </p>
            ) : null}

            {words && !vault ? (
              <div className="beta-qp-field--wide">
                <p className="beta-qp-shopline">
                  Your twelve words. Write them on paper or print the card; they are shown once and
                  we never see them. Lose the words, lose the backup; there is no back door.
                </p>
                <p className="beta-co-words">{words}</p>
                <p className="hero-ctas">
                  <button className="btn" onClick={printCard}>Print wallet card</button>
                </p>
                <label className="beta-qp-shopline">
                  <input
                    type="checkbox"
                    checked={wordsConfirmed}
                    onChange={(e) => setWordsConfirmed(e.target.checked)}
                  />{" "}
                  I wrote the words down somewhere safe
                </label>
              </div>
            ) : null}

            <p className="hero-ctas beta-qp-field--wide">
              <button className="btn btn-primary" onClick={backup} disabled={Boolean(busy)}>
                Back up now
              </button>
            </p>

            <div className="beta-qp-field--wide">
              <p className="beta-qp-shopline">Have words from another phone? Restore here:</p>
              <div className="beta-co-restore">
                <input
                  value={restoreWords}
                  onChange={(e) => setRestoreWords(e.target.value)}
                  placeholder="twelve words, spaces between"
                  aria-label="Backup words"
                />
                <button className="btn" onClick={restore} disabled={Boolean(busy)}>Restore</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
