"use client"

import { useEffect, useState } from "react"

/**
 * The public ledger, read live from public/data/housecalls-ledger.json.
 *
 * Entries are written by scripts/housecalls-ledger.mjs: humans (and the AI in
 * session) through its add command, the send tool and reply poller through
 * its appendEntry export. public/ serves from the working dir at runtime, so
 * a new entry is on the site the moment it is written, no deploy.
 *
 * Counters are computed from machine state by the same tool (test sends do
 * not count; autoreplies are not replies), except drafts-awaiting, which
 * stays a human judgment.
 */

interface LedgerEntry {
  date: string
  kind: string
  note: string
}

interface LedgerFile {
  updated: string
  counters: { sent: number; replies: number; open: number; won: number; drafts_awaiting: number }
  entries: LedgerEntry[]
}

const KIND_LABEL: Record<string, string> = {
  mission: "mission",
  recon: "recon",
  draft: "draft",
  build: "build",
  outreach: "sent",
  reply: "reply",
  won: "won",
}

const COUNTER_ROWS: [keyof LedgerFile["counters"], string][] = [
  ["sent", "Messages sent"],
  ["replies", "Replies"],
  ["open", "Conversations open"],
  ["won", "Engagements won"],
  ["drafts_awaiting", "Drafts awaiting the human"],
]

export function LedgerPanel() {
  const [ledger, setLedger] = useState<LedgerFile | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch("/data/housecalls-ledger.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setLedger)
      .catch(() => setFailed(true))
  }, [])

  if (!ledger) {
    return (
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Scoreboard</b>
            <span>{failed ? "ledger unavailable" : "reading…"}</span>
          </div>
          <p className="beta-chart__note">
            {failed
              ? "The ledger file is not answering. The promise stands; the wire does not."
              : "Reading the ledger…"}
          </p>
        </div>
      </div>
    )
  }

  const entries = [...ledger.entries].reverse() // stored oldest first; newest on top

  return (
    <>
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Scoreboard</b>
            <span>counted by the machine, live</span>
          </div>
          <table className="readout">
            <tbody>
              {COUNTER_ROWS.map(([key, label]) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td className="num">{ledger.counters[key] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Hunt log">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Step</th>
                <th>What happened</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={`${e.date}-${i}`}>
                  <td className="name">{e.date}</td>
                  <td>
                    <span className="tag">{KIND_LABEL[e.kind] ?? e.kind}</span>
                  </td>
                  <td>{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>{entries.length} steps logged</span>
          </div>
        </div>
      </div>
    </>
  )
}
