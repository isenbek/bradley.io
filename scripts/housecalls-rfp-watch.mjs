#!/usr/bin/env node
/**
 * House Calls RFP watcher. The harvest's deadline check only fires when a
 * harvest happens to run; this one runs on its own clock (systemd timer,
 * housecalls-rfp.timer, daily) so a deadline cannot slide because nobody
 * happened to harvest that day.
 *
 *   node scripts/housecalls-rfp-watch.mjs            check + alert (the timer's job)
 *   node scripts/housecalls-rfp-watch.mjs --hunt     also fire ONE cbintel crawl
 *                                                    for fresh MI solicitations
 *   node scripts/housecalls-rfp-watch.mjs --selftest
 *
 * Alert tiers on open, non-submitted entries: OVERDUE, 1 day, 3 days, 7 days.
 * Submitted entries past due move to award watch (informational). Every alert
 * fires ONCE per entry per tier (state file dedupe), so the daily timer nags
 * without spamming. New alerts append a ledger entry in AGGREGATE ONLY:
 * sealed procurement is competitive information, so titles and buyers never
 * reach the public page mid-bid (same rule as the harvest).
 *
 * Exit code: 2 if anything is OVERDUE, 1 if anything is due inside 3 days,
 * else 0. The systemd journal keeps the record either way.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PRIV = path.join(ROOT, "data", "housecalls")
const RFPS = path.join(PRIV, "rfps.json")
const STATE = path.join(PRIV, "rfp-watch-state.json")

const OPEN_UNSUBMITTED = new Set(["watching", "preparing"])
const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback)
const writeJson = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 1) + "\n")

const daysUntil = (due, today) => Math.ceil((new Date(due) - new Date(today)) / 86400000)

/**
 * Pure: derive this run's alerts from the register + dedupe state.
 * Tiers are one-shot per entry: once an entry has alerted at "3d" it will
 * not alert at "3d" again, but it WILL alert at "1d" and "overdue" as those
 * thresholds arrive. OVERDUE re-fires every run on purpose: a slid deadline
 * is a standing emergency, not a notification.
 */
export function deriveAlerts(reg, state, today) {
  const alerts = []
  const fired = { ...(state.fired ?? {}) }
  for (const r of reg.rfps ?? []) {
    if (!r.due) continue
    const d = daysUntil(r.due, today)
    if (OPEN_UNSUBMITTED.has(r.status)) {
      if (d < 0) {
        alerts.push({ id: r.id, tier: "overdue", days: d, msg: `OVERDUE ${-d}d: "${r.title}" (${r.status}) was due ${r.due}` })
      } else {
        for (const [tier, limit] of [["1d", 1], ["3d", 3], ["7d", 7]]) {
          if (d > limit) continue
          // Nearest applicable tier decides; a farther tier never fires after
          // a nearer one already has (it would re-nag on every later run).
          const key = `${r.id}:${tier}`
          if (!fired[key]) {
            alerts.push({ id: r.id, tier, days: d, msg: `due in ${d}d: "${r.title}" (${r.status}), due ${r.due}` })
            fired[key] = today
          }
          break
        }
      }
    } else if (r.status === "submitted" && d < 0) {
      const key = `${r.id}:award`
      if (!fired[key]) {
        alerts.push({ id: r.id, tier: "award", days: d, msg: `award watch: "${r.title}" submitted, due date ${r.due} has passed` })
        fired[key] = today
      }
    }
  }
  // The register being empty is itself a finding while registration is pending;
  // nag weekly, not daily.
  if ((reg.rfps ?? []).length === 0) {
    const last = state.empty_nagged ?? "1970-01-01"
    if (daysUntil(today, last) >= 7) {
      alerts.push({ id: null, tier: "empty", days: null, msg: "RFP register is empty: SIGMA VSS + BidNet vendor registration still pending on the human" })
      return { alerts, state: { ...state, fired, empty_nagged: today } }
    }
  }
  return { alerts, state: { ...state, fired } }
}

/** Worst tier present, for the exit code. */
export function severity(alerts) {
  if (alerts.some((a) => a.tier === "overdue")) return 2
  if (alerts.some((a) => a.tier === "1d" || a.tier === "3d")) return 1
  return 0
}

// ---------- the hunt (gated, one job per invocation) ----------

function huntOnce(state) {
  const platform = readJson(path.join(PRIV, "platform.json"), null)
  if (!platform) {
    console.error("no platform.json; cannot dispatch the hunt crawl")
    return state
  }
  const query =
    "Currently open RFPs, RFQs, and bid solicitations from Michigan state agencies, " +
    "counties, cities, and school districts for data engineering, data warehouse, " +
    "IT modernization, system integration, or GIS work. Only solicitations that are " +
    "open for bids right now, with their due dates and issuing agency."
  const OP = JSON.parse(readFileSync(path.join(ROOT, "lib", "housecalls", "operator.json"), "utf8"))
  const out = execFileSync(platform.cbcli, [
    "cbintel", "jobs", "crawl", "--params",
    JSON.stringify({ workspace_id: platform.workspace_id, query, prompt_type: "investigative", max_urls: 15 }),
  ], { encoding: "utf8" })
  const res = JSON.parse(out)
  console.log(`rfp hunt crawl dispatched: ${res.job_id} (results are curated by hand into rfps.json, per ${OP.operator.hunt_host}/housecalls rules)`)
  return { ...state, hunts: [...(state.hunts ?? []), { job_id: res.job_id, at: new Date().toISOString() }] }
}

// ---------- selftest ----------

function selftest() {
  const reg = {
    rfps: [
      { id: "r1", title: "Slid one", status: "watching", due: "2026-09-01" },
      { id: "r2", title: "Tomorrow", status: "preparing", due: "2026-09-07" },
      { id: "r3", title: "Next week", status: "watching", due: "2026-09-12" },
      { id: "r4", title: "Far off", status: "watching", due: "2026-12-01" },
      { id: "r5", title: "Awaiting award", status: "submitted", due: "2026-09-01" },
      { id: "r6", title: "Won already", status: "won", due: "2026-08-01" },
    ],
  }
  const today = "2026-09-06"
  const run1 = deriveAlerts(reg, {}, today)
  const tiers = Object.fromEntries(run1.alerts.map((a) => [a.id, a.tier]))
  const run2 = deriveAlerts(reg, run1.state, today)
  const empty1 = deriveAlerts({ rfps: [] }, {}, today)
  const empty2 = deriveAlerts({ rfps: [] }, empty1.state, today)
  const emptyLater = deriveAlerts({ rfps: [] }, empty1.state, "2026-09-14")

  const cases = [
    ["overdue fires", tiers.r1 === "overdue"],
    ["1d tier fires nearest", tiers.r2 === "1d"],
    ["7d tier fires", tiers.r3 === "7d"],
    ["far-off is silent", !("r4" in tiers)],
    ["submitted past due goes to award watch", tiers.r5 === "award"],
    ["won is silent", !("r6" in tiers)],
    ["overdue re-fires every run", run2.alerts.some((a) => a.id === "r1" && a.tier === "overdue")],
    ["dated tiers fire once", !run2.alerts.some((a) => a.id === "r2" || a.id === "r3" || a.id === "r5")],
    ["severity 2 on overdue", severity(run1.alerts) === 2],
    ["severity 0 when quiet", severity(run2.alerts.filter((a) => a.tier !== "overdue")) === 0],
    ["empty register nags", empty1.alerts.some((a) => a.tier === "empty")],
    ["empty nag is weekly not daily", empty2.alerts.length === 0 && emptyLater.alerts.some((a) => a.tier === "empty")],
  ]
  let ok = true
  for (const [name, pass] of cases) {
    console.log(`${pass ? "PASS" : "FAIL"} rfp-watch: ${name}`)
    ok &&= pass
  }
  process.exit(ok ? 0 : 1)
}

// ---------- main ----------

async function main() {
  if (process.argv.includes("--selftest")) return selftest()

  const reg = readJson(RFPS, { rfps: [] })
  let state = readJson(STATE, {})
  const today = new Date().toISOString().slice(0, 10)
  const { alerts, state: nextState } = deriveAlerts(reg, state, today)
  state = nextState

  for (const a of alerts) console.log(`[${a.tier}] ${a.msg}`)
  if (alerts.length === 0) console.log(`rfp watch: quiet (${(reg.rfps ?? []).length} entries on the register)`)

  // New non-routine alerts reach the public ledger as aggregates only.
  const newsworthy = alerts.filter((a) => ["overdue", "1d", "3d"].includes(a.tier))
  if (newsworthy.length) {
    try {
      const { appendEntry } = await import("./housecalls-ledger.mjs")
      const overdue = newsworthy.filter((a) => a.tier === "overdue").length
      const near = newsworthy.length - overdue
      const parts = []
      if (overdue) parts.push(`${overdue} past due, which is a failure being stated in public`)
      if (near) parts.push(`${near} inside three days`)
      appendEntry("recon", `The RFP watcher raised its hand: ${parts.join("; ")}. Titles stay off this page mid-bid; the human has the details.`)
    } catch (e) {
      console.error(`ledger append failed: ${e.message}`)
    }
  }

  if (process.argv.includes("--hunt")) state = huntOnce(state)

  writeJson(STATE, state)
  process.exit(severity(alerts))
}

main()
