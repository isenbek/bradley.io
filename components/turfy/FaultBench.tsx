"use client"

import { useEffect, useId, useReducer, useRef } from "react"
import { SERIES } from "@/lib/beta/chart-theme"
import { useChanged } from "@/lib/use-changed"

/**
 * FaultBench: the Turfy v0.1 authority chain, run as a state machine.
 *
 *   <FaultBench />
 *
 * WHAT IT IS. A model of the logic drawn on the build package's four sheets
 * (docs/turfy/turfy-sidecar-v0.1.md, sections 3 and 9). It is NOT telemetry:
 * the sidecar board has not been built, and the panel says so in its bar. The
 * reader powers the model up, breaks it one way at a time, and watches which
 * leg of the chain lets go.
 *
 * WHERE EVERY BEHAVIOUR COMES FROM. Nothing here is invented:
 *   boot, four steps ................ build package 3, "Boot sequence"
 *   daemon crash, panic, power loss . failure table rows 1 and 2: heartbeat
 *                                     stops, watchdog drops, Rain Bird
 *   I2C wedge ....................... row 4: zones frozen, daemon sees the
 *                                     NAK and drops AUTHORITY
 *   relay 5 V supply dies ........... row 5: transfer coils drop
 *   latched zone, healthy daemon .... row 6: NOT covered by the watchdog
 *   timeout ......................... t = 1.1 R C, R1 220k, C1 100 uF, about
 *                                     24 s (sheet 2)
 *   heartbeat period ................ 50 ms low pulse every 10 s or less (the
 *                                     PDF's GPIO map); the model uses 10 s
 * The capacitor voltage is the RC charge curve for those values on the 5 V
 * rail, tripping at two thirds of the rail, which is how a 555 times.
 *
 * WORST CASE, STATED. A dead daemon is modelled with AUTHORITY still held
 * high, because that is the case the watchdog exists for (the acceptance test
 * kills the daemon and expects the bank to drop "within about 24 s"). A Pi
 * that has lost power would let go of the pin sooner; the model does not take
 * credit for that.
 *
 * MOTION. The rest states do not move. The clock runs only after the reader
 * breaks something, only until the chain settles, and then stops: no loop
 * runs because time passed. It runs at four times real speed, so the 24 s
 * timeout plays in six, and the panel says that too. With reduced motion
 * there is no clock at all: every action lands on its settled state at once,
 * with the same log lines and the same model timestamps.
 *
 * STEADY UNDER THE THUMB. Every row reserves the height of its longest
 * wording (the other wordings sit in the same grid cell, hidden), so a state
 * change never moves the keys. The keys are never natively disabled: a key
 * that cannot act says so with aria-disabled and keeps keyboard focus, so a
 * press never drops focus back to the top of the page.
 *
 * COLOUR. Blue is ACTIVE: a lamp is lit while its signal is driven. Orange is
 * ATTENTION: the fault that is in force, and the tag when control has failed
 * back. No red (nothing here is a failed assertion) and no green. Every state
 * is also a word, so none of it depends on colour.
 */

/** Sheet 2: the timing pair, and the rail the 555 runs on. */
const R1_OHM = 220e3
const C1_FARAD = 100e-6
const VCC = 5
const TAU_S = R1_OHM * C1_FARAD
/** A 555 trips at two thirds of its rail. */
const TRIP_V = (VCC * 2) / 3
/** Time for C1 to reach the trip point from empty: ln(3) R C, the "1.1 R C". */
const TRIP_S = Math.log(3) * TAU_S
/** The model's heartbeat period. The build package allows 10 s or less. */
const BEAT_S = 10
/** Where C1 gets to between heartbeats in a healthy system. */
const PEAK_V = VCC * (1 - Math.exp(-BEAT_S / TAU_S))

/** Model seconds per real second. */
const SPEED = 4
const TICK_MS = 100
const BOOT_STEP_MS = 800
const LOG_KEEP = 12

type Phase = "off" | "booting" | "driving" | "counting" | "dropped"
type Fault = "daemon" | "panic" | "i2c" | "relay5v" | "latch"

interface Line {
  id: number
  stamp: string
  text: string
}

interface State {
  phase: Phase
  fault: Fault | null
  /** Boot step reached, 1 to 4. 0 outside a boot. */
  boot: number
  /** Model seconds since the heartbeat stopped. */
  t: number
  log: Line[]
  seq: number
}

type Action =
  | { type: "boot"; instant: boolean }
  | { type: "bootStep" }
  | { type: "fault"; fault: Fault; instant: boolean }
  | { type: "tick"; dt: number }
  | { type: "release" }
  | { type: "unplug" }

const BOOT_LINES = [
  "Pi boots. AUTHORITY has its pull-down: Q2 is off, and the Rain Bird stays in control whatever the GPIOs chatter.",
  "MCP23017 powers up with every pin an input. Zone relays held off. A defined state, no init race.",
  "turfy.service self-checks: I²C ack, config sane, time synced. It starts the heartbeat, then raises AUTHORITY.",
  "Watchdog charged: 555 OUT goes high. Both transistors conduct, the bank engages, and Turfy is driving.",
]

const INITIAL: State = {
  phase: "off",
  fault: null,
  boot: 0,
  t: 0,
  seq: 1,
  log: [
    {
      id: 0,
      stamp: "rest",
      text: "Turfy is unpowered. Every transfer relay rests on NC: the Rain Bird is wired exactly as it was.",
    },
  ],
}

function say(s: State, stamp: string, text: string): Pick<State, "log" | "seq"> {
  return {
    log: [...s.log, { id: s.seq, stamp, text }].slice(-LOG_KEEP),
    seq: s.seq + 1,
  }
}

function clock(t: number): string {
  return `t+${t.toFixed(1)} s`
}

const TRIP_LINE =
  "C1 reaches two thirds of the rail. 555 OUT falls, Q1 opens, the authority bus floats high and the coils drop. Rain Bird."

function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "boot": {
      if (s.phase !== "off" && s.phase !== "dropped") return s
      if (a.instant) {
        let next: State = { ...s, phase: "driving", fault: null, boot: 0, t: 0 }
        BOOT_LINES.forEach((text, i) => {
          next = { ...next, ...say(next, `boot ${i + 1}/4`, text) }
        })
        return next
      }
      return { ...s, phase: "booting", fault: null, boot: 1, t: 0, ...say(s, "boot 1/4", BOOT_LINES[0]) }
    }
    case "bootStep": {
      if (s.phase !== "booting") return s
      const step = s.boot + 1
      const said = say(s, `boot ${step}/4`, BOOT_LINES[step - 1])
      if (step >= 4) return { ...s, phase: "driving", boot: 0, ...said }
      return { ...s, boot: step, ...said }
    }
    case "fault": {
      if (s.phase !== "driving") return s
      switch (a.fault) {
        case "daemon":
        case "panic": {
          const first =
            a.fault === "daemon"
              ? "kill -9 on the daemon. The heartbeat stops with it. AUTHORITY stays high: nobody is left to lower it."
              : "Kernel panic. The heartbeat stops. Worst case, AUTHORITY is frozen high. The 555 does not care what the pin says."
          const started: State = { ...s, phase: "counting", fault: a.fault, t: 0, ...say(s, clock(0), first) }
          if (!a.instant) return started
          return { ...started, phase: "dropped", t: TRIP_S, ...say(started, clock(TRIP_S), TRIP_LINE) }
        }
        case "i2c":
          return {
            ...s,
            phase: "dropped",
            fault: "i2c",
            ...say(
              s,
              "fault",
              "The MCP23017 stops answering. Zones are frozen. The daemon sees the NAK and lowers AUTHORITY: Q2 opens, the bank drops. Rain Bird.",
            ),
          }
        case "relay5v":
          return {
            ...s,
            phase: "dropped",
            fault: "relay5v",
            ...say(
              s,
              "fault",
              "The relay boards lose their 5 V. Both transistors still conduct, and it does not matter: no coil current, the bank drops. Rain Bird.",
            ),
          }
        case "latch":
          return {
            ...s,
            fault: "latch",
            ...say(
              s,
              "fault",
              "A bug leaves a zone bit low. The heartbeat is fine and AUTHORITY is fine: the watchdog sees a healthy daemon. Nothing on this board stops it.",
            ),
          }
      }
      return s
    }
    case "tick": {
      if (s.phase !== "counting") return s
      const t = s.t + a.dt
      if (t < TRIP_S) return { ...s, t }
      return { ...s, phase: "dropped", t: TRIP_S, ...say(s, clock(TRIP_S), TRIP_LINE) }
    }
    case "release": {
      if (s.fault !== "latch") return s
      return {
        ...s,
        fault: null,
        ...say(s, "clear", "Zone released. What closes this for real is a max-runtime cap in the driver layer, not this board."),
      }
    }
    case "unplug": {
      if (s.phase === "off") return s
      return {
        ...s,
        phase: "off",
        fault: null,
        boot: 0,
        t: 0,
        ...say(s, "rest", "Turfy’s power is pulled. The bank drops and the system is stock: the Rain Bird, wired as it was."),
      }
    }
  }
}

const DAEMON = {
  off: "Pi unpowered",
  booting: "Pi booting",
  killed: "dead (kill -9)",
  panic: "gone with the kernel",
  i2c: "main loop running, saw the NAK",
  latch: "main loop running, one zone bit stuck low",
  running: "main loop running",
}

/**
 * Every wording each row can take, at its widest (a ticking number at its
 * largest value). The rows lay these out hidden behind the live text, so each
 * row is always as tall as its longest state.
 */
const GHOSTS = {
  daemon: Object.values(DAEMON),
  heartbeat: [`50 ms low pulse every ${BEAT_S} s`, `silent for ${TRIP_S.toFixed(1)} s`, "silent"],
  cap: [
    `${TRIP_V.toFixed(2)} V and climbing, trips at ${TRIP_V.toFixed(2)} V`,
    `reached ${TRIP_V.toFixed(2)} V at ${clock(TRIP_S)}: tripped`,
    `emptied by every pulse, peaks at ${PEAK_V.toFixed(2)} V, trips at ${TRIP_V.toFixed(2)} V`,
    `0.00 V, trips at ${TRIP_V.toFixed(2)} V`,
  ],
  out555: ["HIGH: Q1 conducts", "LOW: Q1 open"],
  authority: [
    "LOW, lowered by the daemon: Q2 open",
    "LOW on its pull-down: Q2 open",
    "HIGH, held: Q2 conducts",
    "HIGH: Q2 conducts",
  ],
  rail: ["off", "gone", "present"],
  bus: ["sunk LOW", "floats HIGH"],
  bank: ["ENGAGED, valve wires on NO", "DROPPED, valve wires on NC"],
  owner: ["Rain Bird", "Turfy"],
  tag: [
    "Turfy unpowered",
    "booting, step 4 of 4",
    "watchdog counting",
    "failed back to Rain Bird",
    "latched zone, not covered",
    "Turfy has authority",
  ],
}

/** A number keeps its unit on the same line. */
function nb(t: string): string {
  return t.replace(/(\d) (V|s|ms)\b/g, "$1\u00a0$2")
}

/** The live text over its hidden alternatives, all in one grid cell. */
function Steady({ text, ghosts }: { text: string; ghosts: string[] }) {
  return (
    <span className="beta-turfy-steady">
      {ghosts.map((g) => (
        <span key={g} className="beta-turfy-steady__ghost" aria-hidden="true">
          {nb(g)}
        </span>
      ))}
      <span>{nb(text)}</span>
    </span>
  )
}

/** Everything the panel prints, derived from the state and nothing else. */
function derive(s: State) {
  const daemonGone = s.fault === "daemon" || s.fault === "panic"
  const settledAlive = s.phase === "dropped" && (s.fault === "i2c" || s.fault === "relay5v")

  const beating = (s.phase === "booting" && s.boot >= 3) || s.phase === "driving" || settledAlive
  const out555 = (s.phase === "booting" && s.boot >= 4) || s.phase === "driving" || s.phase === "counting" || settledAlive
  const authority =
    (s.phase === "booting" && s.boot >= 3) ||
    s.phase === "driving" ||
    s.phase === "counting" ||
    (s.phase === "dropped" && s.fault !== "i2c")
  const rail5 = s.phase !== "off" && s.fault !== "relay5v"
  const busLow = out555 && authority
  const engaged = busLow && rail5

  let daemon: string
  if (s.phase === "off") daemon = DAEMON.off
  else if (s.phase === "booting" && s.boot < 3) daemon = DAEMON.booting
  else if (s.fault === "daemon") daemon = DAEMON.killed
  else if (s.fault === "panic") daemon = DAEMON.panic
  else if (s.fault === "i2c") daemon = DAEMON.i2c
  else if (s.fault === "latch") daemon = DAEMON.latch
  else daemon = DAEMON.running

  let heartbeat: string
  if (beating) heartbeat = `50 ms low pulse every ${BEAT_S} s`
  else if (daemonGone) heartbeat = `silent for ${s.t.toFixed(1)} s`
  else heartbeat = "silent"

  let capV: number
  let cap: string
  if (s.phase === "counting") {
    capV = VCC * (1 - Math.exp(-s.t / TAU_S))
    cap = `${capV.toFixed(2)} V and climbing, trips at ${TRIP_V.toFixed(2)} V`
  } else if (s.phase === "dropped" && daemonGone) {
    capV = TRIP_V
    cap = `reached ${TRIP_V.toFixed(2)} V at ${clock(TRIP_S)}: tripped`
  } else if (beating) {
    capV = PEAK_V
    cap = `emptied by every pulse, peaks at ${PEAK_V.toFixed(2)} V, trips at ${TRIP_V.toFixed(2)} V`
  } else {
    capV = 0
    cap = `0.00 V, trips at ${TRIP_V.toFixed(2)} V`
  }

  let authorityText: string
  if (!authority) {
    authorityText = s.fault === "i2c" ? "LOW, lowered by the daemon: Q2 open" : "LOW on its pull-down: Q2 open"
  } else if (daemonGone) {
    authorityText = "HIGH, held: Q2 conducts"
  } else {
    authorityText = "HIGH: Q2 conducts"
  }

  let rail: string
  if (s.phase === "off") rail = "off"
  else if (s.fault === "relay5v") rail = "gone"
  else rail = "present"

  let tag: { text: string; tone: "plain" | "live" | "warn" }
  if (s.phase === "off") tag = { text: "Turfy unpowered", tone: "plain" }
  else if (s.phase === "booting") tag = { text: `booting, step ${s.boot} of 4`, tone: "plain" }
  else if (s.phase === "counting") tag = { text: "watchdog counting", tone: "warn" }
  else if (s.phase === "dropped") tag = { text: "failed back to Rain Bird", tone: "warn" }
  else if (s.fault === "latch") tag = { text: "latched zone, not covered", tone: "warn" }
  else tag = { text: "Turfy has authority", tone: "live" }

  return {
    beating,
    out555,
    authority,
    rail5,
    busLow,
    engaged,
    daemon,
    daemonUp: s.phase !== "off" && !(s.phase === "booting" && s.boot < 3) && !daemonGone,
    heartbeat,
    capV,
    cap,
    out555Text: out555 ? "HIGH: Q1 conducts" : "LOW: Q1 open",
    authorityText,
    rail,
    bus: busLow ? "sunk LOW" : "floats HIGH",
    bank: engaged ? "ENGAGED, valve wires on NO" : "DROPPED, valve wires on NC",
    owner: engaged ? "Turfy" : "Rain Bird",
    tag,
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** One signal: a lamp, its name, and its state in words. */
function Row({
  name,
  on,
  flag,
  text,
  ghosts,
  children,
}: {
  name: string
  on: boolean
  /** The state as a token, so a ticking number in the text is not a "change". */
  flag: string
  text: string
  ghosts: string[]
  /** Anything drawn above the words, such as the capacitor's meter. Above,
   *  so the room the longest wording reserves falls at the foot of the row. */
  children?: React.ReactNode
}) {
  const changed = useChanged(flag)
  return (
    <div>
      <dt>
        <i className="beta-turfy-lamp" data-on={on} aria-hidden="true" />
        {name}
      </dt>
      <dd className={changed ? "is-changed beta-live-settle" : undefined}>
        {children}
        <Steady text={text} ghosts={ghosts} />
      </dd>
    </div>
  )
}

export function FaultBench() {
  const [state, dispatch] = useReducer(reduce, INITIAL)
  const logRef = useRef<HTMLOListElement>(null)
  const v = derive(state)
  const ownerChanged = useChanged(v.owner)

  // The boot sequence: one step at a time, then stop.
  useEffect(() => {
    if (state.phase !== "booting") return
    const id = setTimeout(() => dispatch({ type: "bootStep" }), BOOT_STEP_MS)
    return () => clearTimeout(id)
  }, [state.phase, state.boot])

  // The watchdog's clock: runs only while C1 is charging toward the trip.
  useEffect(() => {
    if (state.phase !== "counting") return
    const id = setInterval(() => dispatch({ type: "tick", dt: (TICK_MS / 1000) * SPEED }), TICK_MS)
    return () => clearInterval(id)
  }, [state.phase])

  // Keep the newest log line in view inside the log's own box.
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.seq])

  const ids = useId()
  const canBoot = state.phase === "off" || state.phase === "dropped"
  const canUnplug = state.phase !== "off" && state.phase !== "booting"
  const latched = state.fault === "latch"
  /** Faults act only while Turfy is driving. A latched zone still counts as driving. */
  const canBreak = state.phase === "driving"

  /** A press that does nothing when the key cannot act. */
  const act = (ok: boolean, run: () => void) => () => {
    if (ok) run()
  }
  const fault = (f: Fault) =>
    act(canBreak, () => dispatch({ type: "fault", fault: f, instant: prefersReducedMotion() }))
  const key = (f: Fault) => `push beta-turfy-key${state.fault === f ? " armed" : ""}`

  return (
    <div className="panel beta-turfy-bench">
      <div className="panel-face">
        <div className="panel-bar beta-inst-bar">
          <b>Fault bench</b>
          <span className="beta-inst-tags">
            <span className="tag beta-inst">model, not hardware</span>
            <span
              className={`tag beta-inst${v.tag.tone === "live" ? " beta-inst--live" : v.tag.tone === "warn" ? " warn" : ""}`}
            >
              <Steady text={v.tag.text} ghosts={GHOSTS.tag} />
            </span>
          </span>
        </div>

        <p className="beta-turfy-verdict">
          <span className="beta-turfy-verdict__k">Valves answer to</span>
          <b className={`beta-turfy-verdict__v${ownerChanged ? " beta-live-settle" : ""}`}>
            <Steady text={v.owner} ghosts={GHOSTS.owner} />
          </b>
        </p>

        <dl className="beta-turfy-chain">
          <Row name="turfy daemon" on={v.daemonUp} flag={v.daemon} text={v.daemon} ghosts={GHOSTS.daemon} />
          <Row
            name="HEARTBEAT, GPIO27"
            on={v.beating}
            flag={v.beating ? "beat" : "silent"}
            text={v.heartbeat}
            ghosts={GHOSTS.heartbeat}
          />
          <Row
            name="C1, the watchdog’s capacitor"
            on={state.phase === "counting"}
            flag={state.phase === "counting" ? "charging" : v.cap}
            text={v.cap}
            ghosts={GHOSTS.cap}
          >
            <span className="beta-meter beta-turfy-meter" aria-hidden="true">
              <span
                className="beta-meter__fill"
                style={{ width: `${(v.capV / VCC) * 100}%`, background: SERIES[0].token }}
              />
              <span className="beta-meter__thr" style={{ left: `${(TRIP_V / VCC) * 100}%` }} />
            </span>
          </Row>
          <Row name="555 OUT, into Q1" on={v.out555} flag={v.out555Text} text={v.out555Text} ghosts={GHOSTS.out555} />
          <Row
            name="AUTHORITY, GPIO17, into Q2"
            on={v.authority}
            flag={v.authorityText}
            text={v.authorityText}
            ghosts={GHOSTS.authority}
          />
          <Row name="Relay boards, 5 V" on={v.rail5} flag={v.rail} text={v.rail} ghosts={GHOSTS.rail} />
          <Row name="Authority bus" on={v.busLow} flag={v.bus} text={v.bus} ghosts={GHOSTS.bus} />
          <Row name="Transfer bank" on={v.engaged} flag={v.bank} text={v.bank} ghosts={GHOSTS.bank} />
        </dl>

        {/* Two sets on one fixed grid: power on top, the five faults under it.
            A key that cannot act is aria-disabled, never disabled, so it keeps
            focus; its press does nothing. */}
        <div className="beta-turfy-keys">
          <div className="beta-turfy-keyset" role="group" aria-labelledby={`${ids}-power`}>
            <span className="beta-turfy-keyset__k" id={`${ids}-power`}>
              Power
            </span>
            <div className="beta-turfy-keyrow">
              <button
                type="button"
                className="push beta-turfy-key"
                aria-disabled={!canBoot}
                onClick={act(canBoot, () => dispatch({ type: "boot", instant: prefersReducedMotion() }))}
              >
                Boot Turfy
              </button>
              <button
                type="button"
                className="push beta-turfy-key"
                aria-disabled={!canUnplug}
                onClick={act(canUnplug, () => dispatch({ type: "unplug" }))}
              >
                Pull Turfy’s power
              </button>
            </div>
          </div>
          <div className="beta-turfy-keyset" role="group" aria-labelledby={`${ids}-faults`}>
            <span className="beta-turfy-keyset__k" id={`${ids}-faults`}>
              Break one thing, while Turfy drives
            </span>
            <div className="beta-turfy-keyrow">
              <button type="button" className={key("daemon")} aria-disabled={!canBreak} onClick={fault("daemon")}>
                Kill the daemon
              </button>
              <button type="button" className={key("panic")} aria-disabled={!canBreak} onClick={fault("panic")}>
                Panic the kernel
              </button>
              <button type="button" className={key("i2c")} aria-disabled={!canBreak} onClick={fault("i2c")}>
                Wedge the I²C bus
              </button>
              <button type="button" className={key("relay5v")} aria-disabled={!canBreak} onClick={fault("relay5v")}>
                Cut the relay 5&nbsp;V
              </button>
              <button
                type="button"
                className={key("latch")}
                aria-disabled={!canBreak}
                aria-pressed={latched}
                onClick={
                  latched
                    ? () => dispatch({ type: "release" })
                    : fault("latch")
                }
              >
                Latch a zone
              </button>
            </div>
          </div>
        </div>

        <ol className="beta-turfy-log" ref={logRef} role="log" aria-live="polite" aria-label="Bench log" tabIndex={0}>
          {state.log.map((l) => (
            <li key={l.id}>
              <span className="beta-turfy-log__t">{l.stamp}</span>
              <span>{l.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
