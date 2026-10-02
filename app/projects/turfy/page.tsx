import Link from "next/link"
import { FaultBench } from "@/components/turfy/FaultBench"

/**
 * Turfy, on the style kit.
 *
 * A design dossier for a fail-safe irrigation sidecar. The page was first
 * written for the v3 design (git 4618109), retired on 2026-08-30 and rebuilt
 * here on 2026-10-02. Its argument and most of its sentences are the earlier
 * page's; what changed is the ground they sit on and three facts:
 *
 *   1. STATUS. The hardware is designed and not built. The old page implied
 *      that only through a "v0.1" pill. This one says it first, in a table.
 *   2. THE HEARTBEAT. The old page said the watchdog "must be fed every ~24s".
 *      The build package says a pulse every 10 s or less, and about 24 s of
 *      silence before the relays drop. Corrected.
 *   3. THE I2C ROW. The old page marked a wedged I2C bus "fails safe" beside
 *      the hardware rows. The build package's own table says the daemon has to
 *      notice the NAK and lower AUTHORITY, which is software. The ledger now
 *      says who closes each row.
 *
 * SOURCES. docs/turfy/turfy-sidecar-v0.1.md (the build package),
 * docs/turfy/turfy-sidecar-v0.1-build-package.pdf (its cover: channel map, GPIO
 * map, acceptance test), docs/turfy/turfy-project-1.0-chat.md (the teardown
 * notes). Nothing on this page is measured: there is no hardware to measure.
 * The one panel is a model, and it is labelled as one.
 *
 * GROUNDS. Prose, tables, photographs and schematics are documentation and sit
 * on paper. The fault bench computes its states, so it is a panel.
 */

const STATUS: { piece: string; note: string; state: string; open: boolean }[] = [
  {
    piece: "The Rain Bird, opened and mapped",
    note: "Five photographs, three boards, the tap point found.",
    state: "done",
    open: false,
  },
  {
    piece: "v0.1 build package",
    note: "Four schematic sheets, channel map, pin map, parts list, acceptance test.",
    state: "drawn",
    open: false,
  },
  { piece: "The sidecar board", note: "Two relay boards, the watchdog, the sense bank.", state: "not built", open: true },
  { piece: "The turfy daemon", note: "Heartbeat, zone driver, scheduler.", state: "not written", open: true },
  { piece: "Acceptance test", note: "Five steps, before a valve is connected.", state: "not run", open: true },
  { piece: "Phases 0 to 3", note: "Passive logging through weather and vision.", state: "not started", open: true },
]

const PRINCIPLES = [
  {
    title: "Rain Bird keeps authority",
    body: "The 1990s controller stays wired exactly as it is. Turfy is a sidecar on the station outputs. It never replaces the brain; it borrows it.",
  },
  {
    title: "A hardware dead-man",
    body: "A 555 missing-pulse watchdog must be fed by the daemon’s own main loop, one pulse every 10\u00a0seconds or less. Go quiet for about 24\u00a0seconds and the transfer relays physically drop.",
  },
  {
    title: "Fail back to dumb",
    body: "Power loss, kernel panic, a crashed or hung daemon: each one reverts to the Rain Bird with zero software involved. A stuck valve floods a yard, so this can’t stick.",
  },
]

const WATCHDOG: { k: string; v: string }[] = [
  { k: "Circuit", v: "NE555 missing-pulse detector" },
  { k: "R1", v: "220\u00a0kΩ" },
  { k: "C1", v: "100\u00a0µF, low leakage" },
  { k: "Timeout, 1.1 × R × C", v: "about 24\u00a0s" },
  { k: "Heartbeat, GPIO27", v: "50\u00a0ms low pulse, every 10\u00a0s or less" },
  { k: "Authority, GPIO17", v: "pull-down default, active high" },
  { k: "Authority gate, Q1 and Q2", v: "two 2N2222 in series" },
]

const BOOT = [
  "Pi boots. AUTHORITY GPIO defaults pull-down → Rain Bird stays in control regardless of any GPIO chatter.",
  "MCP23017 powers up all-inputs (POR default) → zone relays held off. Defined state, no init race.",
  "turfy.service self-checks (I²C ack, config sane, time synced), starts the heartbeat, then raises AUTHORITY.",
  "Watchdog charges within one timeout; the transfer bank engages and Turfy is driving.",
]

const FAILURES: { failure: string; result: string; by: string; covered: boolean }[] = [
  {
    failure: "Pi power loss / kernel panic",
    result: "Heartbeat stops → watchdog drops → Rain Bird.",
    by: "the watchdog",
    covered: true,
  },
  {
    failure: "Daemon crash or hang",
    result: "Same: the heartbeat is owned by the daemon loop.",
    by: "the watchdog",
    covered: true,
  },
  {
    failure: "Pi reboot GPIO chatter",
    result: "AUTHORITY pull-down + MCP23017 power-on reset = no valve action.",
    by: "boot defaults",
    covered: true,
  },
  {
    failure: "Relay 5 V supply dies",
    result: "Transfer coils drop → Rain Bird.",
    by: "the relay coil",
    covered: true,
  },
  {
    failure: "Both controllers fire one zone",
    result: "Harmless: shared transformer, same phase.",
    by: "one transformer",
    covered: true,
  },
  {
    failure: "I²C bus wedge",
    result: "Zones frozen. The daemon detects the NAK → drops AUTHORITY.",
    by: "the daemon",
    covered: true,
  },
  {
    failure: "Healthy daemon, latched zone",
    result:
      "Not caught by the watchdog → hard-capped by a per-zone max-runtime in the driver layer, plus a flow-meter alarm in v0.2.",
    by: "software invariant",
    covered: false,
  },
]

const SHEETS = [
  {
    n: 1,
    src: "/turfy/sheet1.svg",
    w: 1228,
    h: 382,
    title: "Power + valve path",
    cap: "24VAC tap → fuse + MOV → zone-bank relay → transfer-bank relay → valve solenoid. One channel of seven.",
  },
  {
    n: 2,
    src: "/turfy/sheet2.svg",
    w: 901,
    h: 405,
    title: "Watchdog + authority",
    cap: "The 555 missing-pulse detector (t ≈ 1.1·R·C ≈ 24 s) feeding the Q1/Q2 series-AND that sinks the transfer bank’s authority bus.",
  },
  {
    n: 3,
    src: "/turfy/sheet3.svg",
    w: 831,
    h: 313,
    title: "Sense front-end",
    cap: "One H11AA1 AC-input opto per Rain Bird station output: the passive-logging phase. Typical of seven.",
  },
  {
    n: 4,
    src: "/turfy/sheet4.svg",
    w: 849,
    h: 344,
    title: "Zone drive",
    cap: "Pi I²C → MCP23017 (0x20) → zone-bank inputs. Power-on leaves every pin hi-Z, so relays stay off.",
  },
]

/** The widest sheet. The others are drawn at the same scale, as a share of it. */
const SHEET_MAX_W = Math.max(...SHEETS.map((s) => s.w))

const BOARDS = [
  {
    src: "/turfy/teardown-power.webp",
    alt: "Power board showing station triacs TH1 to TH8, red MOVs, a glass fuse and the field terminal block",
    tag: "The tap point",
    cap: "Power board (949-26330): eight station triacs TH1 to TH8, per-output MOVs, and a fused 24VAC feed. Field wires land on this screw terminal, so zone wires lift straight off and nothing gets cut.",
  },
  {
    src: "/turfy/teardown-logic.webp",
    alt: "Logic board, component side: rows of small transistors, resistors, wire jumpers and red NP marks, with the COB daughtercard at one corner",
    tag: "The drivers",
    cap: "Logic board (049-26062): discrete transistor gate drivers between the micro and the triacs, everything through one board-to-board header. The red NP marks are positions left unpopulated for sibling models.",
  },
  {
    src: "/turfy/teardown-cob.webp",
    alt: "COB daughtercard with epoxy-blob microcontroller and a station-count solder-jumper legend",
    tag: "The blob",
    cap: "COB daughtercard: the epoxy blob is the micro, and that S1/S2 jumper table is the 4/6/8-station config for the shared module. ‘OPEN:ACTIVE HIGH’ is the jumper-sense legend, not an I/O spec.",
  },
]

const ROADMAP = [
  {
    phase: "Phase 0",
    title: "Passive learn",
    body: "An H11AA1 opto per station output logs when the Rain Bird actually waters. Validates zone mapping and collects a baseline schedule at zero risk, since Turfy never asserts.",
    state: "instrumentation",
  },
  {
    phase: "Phase 1",
    title: "Take authority",
    body: "Transfer relays + watchdog go live. Turfy replicates the dumb schedule first, proving the fail-safe handover with a meter before anything smart happens.",
    state: "the sidecar",
  },
  {
    phase: "Phase 2",
    title: "Flow metering",
    body: "An inline pulse flow meter learns each zone’s baseline GPM. That’s the killer feature: it detects stuck valves, broken heads (flow too high) and clogged lines (flow too low), per zone.",
    state: "closing the loop",
  },
  {
    phase: "Phase 3",
    title: "Weather + vision",
    body: "ET-based scheduling (Penman-Monteith / Hargreaves) scales runtime to replace the daily deficit, minus rainfall. A cheap camera adds an NDVI-ish turf-stress index on top.",
    state: "the AI layer",
  },
]

const BOM: { qty: string; part: string; role: string }[] = [
  { qty: "2", part: "8-channel 5\u00a0V opto relay board, SPDT, NO and NC exposed", role: "transfer bank, zone bank" },
  { qty: "1", part: "MCP23017", role: "zone drive, defined power-on state" },
  { qty: "1", part: "NE555 + 2N3906 + 220\u00a0kΩ + 100\u00a0µF + decoupling", role: "watchdog" },
  { qty: "2", part: "2N2222 + 10\u00a0kΩ", role: "authority AND" },
  { qty: "7", part: "H11AA1 + 2.2\u00a0kΩ 1\u00a0W + 10\u00a0kΩ + 1\u00a0µF", role: "sense bank" },
  { qty: "1", part: "1\u00a0A fuse and holder, 39\u00a0V MOV", role: "24VAC tap protection" },
  { qty: "1", part: "5\u00a0V 2\u00a0A supply", role: "relay coils" },
  { qty: "1", part: "Raspberry Pi, on its own 5\u00a0V supply", role: "the daemon" },
]

const PINS: { gpio: string; signal: string; note: string }[] = [
  { gpio: "17", signal: "AUTHORITY", note: "out. Pull-down default; high requests control." },
  { gpio: "27", signal: "HEARTBEAT", note: "out. Idle high; 50\u00a0ms low pulse every 10\u00a0s or less, from the daemon main loop only." },
  { gpio: "2, 3", signal: "I²C1", note: "bus. MCP23017 at 0x20." },
  { gpio: "5, 6, 13, 19, 26, 16", signal: "SENSE 1 to 6", note: "in. H11AA1 outputs; low means a Rain Bird station is energized." },
  { gpio: "20", signal: "SENSE MV", note: "in. Same, for the master valve." },
  { gpio: "21", signal: "spare", note: "in. Reserved for flow-meter pulses." },
]

const ACCEPTANCE = [
  "Transfer bank unpowered: continuity from every Rain Bird station terminal to its valve terminal, all 8 channels. The Rain Bird path is intact.",
  "Power logic only, no 24VAC: boot the Pi and verify every relay stays silent through two full reboots. The GPIO chatter test.",
  "Start the daemon; confirm the transfer bank engages only after AUTHORITY is high and the heartbeat is running. Kill -9 the daemon: the bank must drop within about 24\u00a0s.",
  "Pull the heartbeat wire with the daemon running: same result.",
  "Apply 24VAC with a dummy load on channel 1, a 24 V lamp or a spare solenoid: a Rain Bird manual start drives it with authority off, and MCP23017 bit 0 drives it with authority on.",
]

export default function TurfyPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <Link href="/projects">Projects</Link>
          </span>
          <span>
            {" / "}
            <span aria-current="page">Turfy</span>
          </span>
        </nav>
        <h1>An AI sprinkler brain that fails back to dumb</h1>
        <p className="mh-meta">
          <span className="tag">irrigation sidecar</span>
          <span className="tag">v0.1 build package</span>
          <span className="tag warn">designed, not built</span>
        </p>
      </div>

      <p className="lede">
        Turfy is the design for a weather-informed, camera-and-sensor irrigation controller, but
        the clever part isn’t the AI. It’s that it only touches the lawn when it’s provably
        healthy. It rides alongside a 1990s Rain Bird as a fail-safe sidecar: take authority while
        the watchdog is fed, and hand control straight back the instant anything goes wrong. In
        hardware. Because a stuck valve is a flooded yard and a very large water bill.
      </p>

      {/* WHERE IT STANDS ================================================= */}
      <div className="beta-turfy-split">
        <figure className="beta-die">
          <div className="beta-die__frame">
            <img
              src="/turfy/rainbird-faceplate.webp"
              alt="Rain Bird ESP-6Si faceplate with its analog scheduling dial"
              width={952}
              height={1269}
            />
            <span className="beta-die__tag">The brief</span>
          </div>
          <figcaption>
            Rain Bird ESP-6Si: an analog dial, six stations, an ‘Adjust Water %’ knob. About as
            simple as irrigation controllers get. Reused, not replaced: Turfy borrows its
            transformer, its valves, and its job as the always-there fallback brain.
          </figcaption>
        </figure>

        <div>
          <div className="prose beta-sec">
            <h2>Where it stands</h2>
            <p>
              I have a simple sprinkler system at home, and I wanted an AI-driven, weather-informed
              one without ever making the yard depend on a Raspberry Pi. This page is the design
              for that. The controller has been opened and mapped, and the first build package is
              drawn. The board has not been built, and nothing here has ever switched a valve.
            </p>
          </div>
          <div className="ledger beta-turfy-ledger beta-turfy-ledger--stack">
            <div className="scroller" tabIndex={0} role="region" aria-label="What is built and what is only designed">
              <table>
                <thead>
                  <tr>
                    <th>Piece</th>
                    <th>What it is</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {STATUS.map((s) => (
                    <tr key={s.piece}>
                      <td className="name">{s.piece}</td>
                      <td>{s.note}</td>
                      <td>
                        <span className={s.open ? "tag warn" : "tag"}>{s.state}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="measured beta-turfy-src">
            <span>
              <b>docs/turfy</b>, the v0.1 build package and the teardown notes, 9 July 2026. No
              hardware exists to measure.
            </span>
          </p>
        </div>
      </div>

      {/* SAFE BY CONSTRUCTION ============================================ */}
      <div className="prose beta-sec">
        <h2>Safe by construction</h2>
      </div>
      <div className="piece-grid beta-turfy-grid beta-turfy-grid--3">
        {PRINCIPLES.map((p) => (
          <div className="rail" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>
      <div className="prose beta-sec">
        <h3>The invariant the whole design hangs on</h3>
        <p>
          A de-energized transfer bank leaves the Rain Bird wired <em>exactly</em> as it is today.
          It’s the first line of the acceptance test, proven with a continuity meter before
          anything is ever powered on. Pull Turfy’s power in the middle of a watering cycle and the
          system is stock.
        </p>
      </div>

      {/* ARCHITECTURE ==================================================== */}
      <div className="prose beta-sec">
        <h2>The transfer-switch architecture</h2>
        <p>
          It’s the classic automatic-transfer-switch pattern applied to sprinklers. An SPDT relay
          per zone: Rain Bird output on <strong>NC</strong>, Turfy output on <strong>NO</strong>,
          valve wire on the common pole. One authority line pulls the whole bank. Unpowered,
          crashed, or watchdog-tripped, the relays drop and the Rain Bird is back in control.
        </p>
      </div>

      <figure className="beta-turfy-path" aria-label="Signal path of the v0.1 design">
        <div className="beta-turfy-path__flow">
          <div className="beta-turfy-path__in">
            <div className="beta-turfy-node">
              <span className="beta-turfy-node__k">fallback, on NC</span>
              <b>Rain Bird ESP-6Si</b>
              <span className="beta-turfy-node__s">station outputs, as wired today</span>
            </div>
            <div className="beta-turfy-node">
              <span className="beta-turfy-node__k">smart path, on NO</span>
              <b>Pi → MCP23017 → zone bank</b>
              <span className="beta-turfy-node__s">its relays switch the same 24VAC leg</span>
            </div>
          </div>
          <span className="beta-turfy-arrow" aria-hidden="true" />
          <div className="beta-turfy-node beta-turfy-node--hub">
            <span className="beta-turfy-node__k">transfer bank</span>
            <b>8× SPDT relay</b>
            <span className="beta-turfy-node__s">one authority line picks NC or NO</span>
          </div>
          <span className="beta-turfy-arrow" aria-hidden="true" />
          <div className="beta-turfy-node">
            <span className="beta-turfy-node__k">field wires, on the relay COM poles</span>
            <b>Valves 1 to 6 + MV</b>
            <span className="beta-turfy-node__s">the valve return stays on the Rain Bird’s COM terminal</span>
          </div>
        </div>
        <figcaption className="beta-turfy-path__gate">
          <span className="beta-turfy-node__k">authority picks the bank, active low</span>
          <span className="beta-turfy-gate">
            <b>555 watchdog</b>
            <span aria-label="and">∧</span>
            <b>Pi GPIO17</b>
          </span>
          <span className="beta-turfy-path__hb">fed by the heartbeat, from the daemon’s main loop</span>
        </figcaption>
      </figure>

      <div className="prose beta-sec">
        <p>
          The valve common stays on the Rain Bird’s COM terminal and is never moved or switched.
          Turfy’s valve supply is tapped from the Rain Bird’s own 24VAC terminals, behind a 1&nbsp;A fuse
          and a 39&nbsp;V MOV. With one transformer, paralleled outputs are harmless even during relay
          bounce.
        </p>
      </div>
      <p className="notice beta-turfy-rule">
        <b>The one rule that must survive every revision:</b> never run a second 24VAC transformer
        while the NC path to the Rain Bird exists. Out-of-phase secondaries through the transfer
        relay = circulating current and dead triacs. Turfy steals 24VAC from the Rain Bird’s own
        terminals so both controllers switch the same hot leg.
      </p>

      {/* SAFETY CORE ===================================================== */}
      <div className="beta-turfy-split beta-turfy-split--aside">
        <div className="prose beta-sec">
          <h2>The safety core</h2>
          <blockquote>
            <p>“The heartbeat must prove application liveness, not kernel liveness.”</p>
          </blockquote>
          <p>
            So it’s toggled from the daemon’s own main loop, not a background timer. A timer would
            keep ticking after a crash and defeat the entire point. Never a cron job, never
            hardware PWM.
          </p>
          <h3>Authority = liveness ∧ intent</h3>
          <p>
            Two 2N2222s in series pull the transfer bank low. It engages only when the 555 says the
            daemon is alive <em>and</em> the Pi explicitly asserts yes. Either transistor off → the
            line floats high → the bank drops → Rain Bird.
          </p>
          <p className="beta-turfy-formula">
            <code>authority ⇔ (heartbeat alive) ∧ (Pi says yes)</code>
          </p>
        </div>

        <div className="rail beta-turfy-facts">
          <h3>The watchdog, in numbers</h3>
          <dl className="kv">
            {WATCHDOG.map((w) => (
              <div key={w.k}>
                <dt>{w.k}</dt>
                <dd>{w.v}</dd>
              </div>
            ))}
          </dl>
          <p className="measured beta-turfy-src">
            <span>
              <b>Sheet 2</b> and the pin map, build package v0.1. Nominal part values.
            </span>
          </p>
        </div>
      </div>

      <div className="prose beta-sec">
        <h3>Boot sequence: safe at every step</h3>
      </div>
      <div className="beta-steps">
        <ol>
          {BOOT.map((step, i) => (
            <li key={i}>
              <span className="beta-steps__n">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* FAILURE TABLE =================================================== */}
      <div className="prose beta-sec">
        <h2>Every way it can fail</h2>
        <p>
          Seven failure modes. Four end at the Rain Bird with no software in the path. One is
          harmless by construction. One depends on the daemon noticing. And one the watchdog cannot
          see at all, which the build package says in so many words.
        </p>
        <p>
          The bench is the design run as a state machine: the logic on the four sheets, not
          telemetry. Boot it, then break it.
        </p>
      </div>

      <FaultBench />
      <p className="measured beta-turfy-src">
        <span>
          <b>Model</b>, computed in your browser from the v0.1 build package: sheet 2 and the
          failure table. Its clock runs at 4× so the 24&nbsp;s timeout plays in 6. No hardware is
          attached, because none is built.
        </span>
      </p>

      <div className="ledger beta-turfy-ledger beta-turfy-ledger--stack beta-turfy-fail">
        <div className="scroller" tabIndex={0} role="region" aria-label="Failure modes of the v0.1 design">
          <table>
            <thead>
              <tr>
                <th>Failure</th>
                <th>Result</th>
                <th>Closed by</th>
              </tr>
            </thead>
            <tbody>
              {FAILURES.map((f) => (
                <tr key={f.failure}>
                  <td className="name">{f.failure}</td>
                  <td>{f.result}</td>
                  <td>
                    <span className={f.covered ? "tag" : "tag warn"}>{f.by}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>7 failure modes</span>
            <span>build package v0.1, section 9</span>
          </div>
        </div>
      </div>

      <div className="prose beta-sec">
        <p>
          The one hole, a latched zone with a healthy daemon, is a software invariant: hard-cap
          every zone activation at a maximum runtime in the driver layer itself, not the scheduler.
          The same layer holds a second interlock: never more than one zone at a time, for the
          transformer’s VA budget and for water pressure.
        </p>
      </div>

      {/* BUILD SHEETS ==================================================== */}
      <div className="prose beta-sec">
        <h2>The four build sheets</h2>
        <p>
          Four sheets carry the build from the 24VAC tap all the way to the Pi’s I²C bus: the valve
          path, the watchdog and authority gate, the sense front-end, and the zone drive. They are
          drawn from a parametric source, so when a board photograph changes a fact it is a
          one-line edit and a re-render rather than a redraw.
        </p>
      </div>
      <div className="beta-turfy-sheets">
        {SHEETS.map((s) => (
          <figure className="beta-turfy-sheet" key={s.n}>
            <a
              className="beta-turfy-sheet__frame"
              href={s.src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open sheet ${s.n}, ${s.title}, full size`}
            >
              <img
                src={s.src}
                alt={`Turfy schematic, sheet ${s.n}: ${s.title}`}
                width={s.w}
                height={s.h}
                loading="lazy"
                style={{ "--beta-turfy-sheet": `${((s.w / SHEET_MAX_W) * 100).toFixed(1)}%` } as React.CSSProperties}
              />
            </a>
            <figcaption>
              <span className="tag">Sheet {s.n}</span>
              <span>
                <strong>{s.title}.</strong> {s.cap}{" "}
                <a href={s.src} target="_blank" rel="noopener noreferrer">
                  Open full size
                </a>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* TEARDOWN ======================================================== */}
      <div className="prose beta-sec">
        <h2>Reverse-engineering the box</h2>
        <p>
          Before you can sidecar a sealed 1990s controller, you have to map it. Board by board:
          what’s the tap point, where does 24VAC come from, and is the fallback actually
          trustworthy?
        </p>
      </div>

      <div className="beta-turfy-split beta-turfy-split--left">
        <figure className="beta-die">
          <div className="beta-die__frame">
            <img
              src="/turfy/teardown-open.webp"
              alt="The opened controller: green logic board over an orange power board, with a soldered-in lithium battery"
              width={952}
              height={1269}
              loading="lazy"
            />
            <span className="beta-die__tag">Fully mapped</span>
          </div>
          <figcaption>
            Inside: a 24VAC transformer, a COB micro, one triac per station, and a hobbyist
            coin-cell hack that holds the schedule through outages, which is what makes the
            fallback trustworthy.
          </figcaption>
        </figure>

        <div className="prose beta-sec">
          <h3>What the photographs settled</h3>
          <p>
            The tap point. Field wires land on a screw terminal block on the power board, so the
            sidecar never touches these boards. The Rain Bird already fuses and clamps its own
            side; Turfy’s fuse and MOV protect the tap independently. The green wire is earth to
            the chassis: it stays, and Turfy’s logic ground stays unbonded from it.
          </p>
          <h3>What they could not</h3>
          <ul className="beta-turfy-open">
            <li>
              The terminal block legend. Whether the master-valve terminal is broken out on the 6Si
              is not readable here. The eighth triac position suggests the board supports it.
            </li>
            <li>
              The transformer’s VA rating, which sets how many coils the shared supply tolerates
              during a handover.
            </li>
            <li>
              The battery. It holds the time and the program through an outage, so it is worth
              metering: if it is dead, the fallback boots into a default program.
            </li>
            <li>
              Triac leakage. With the Rain Bird off, each triac leaks a little through its MOV
              network into the sense optos. With a 2.2&nbsp;kΩ series resistor that should read as
              off. The teardown notes still want it proven, not assumed: scope a SENSE line with
              the station idle and see a solid high. That would be a sixth step; the acceptance
              test below has five.
            </li>
          </ul>
        </div>
      </div>

      <div className="beta-turfy-shots">
        {BOARDS.map((t) => (
          <figure className="beta-die" key={t.src}>
            <div className="beta-die__frame">
              <img src={t.src} alt={t.alt} width={1269} height={952} loading="lazy" />
              <span className="beta-die__tag">{t.tag}</span>
            </div>
            <figcaption>{t.cap}</figcaption>
          </figure>
        ))}
      </div>

      {/* ROADMAP ========================================================= */}
      <div className="prose beta-sec">
        <h2>Validate each layer</h2>
        <p>
          None of the four phases has run. Phase 0 is first for a reason: a couple of weeks of
          passive logging puts the whole software stack on real signals while the old brain is
          still driving.
        </p>
      </div>
      <div className="piece-grid beta-turfy-grid beta-turfy-grid--4">
        {ROADMAP.map((r) => (
          <div className="rail" key={r.phase}>
            <span className="beta-proj-k">
              {r.phase} · {r.state}
            </span>
            <h3>{r.title}</h3>
            <p>{r.body}</p>
          </div>
        ))}
      </div>

      {/* BUILD PACKAGE =================================================== */}
      <div className="prose beta-sec">
        <h2>The v0.1 build package</h2>
        <p>
          Two stock relay boards, an MCP23017 for a defined power-on state, a 555 watchdog, and an
          H11AA1 sense bank: everything a Turfy v0.1 board needs, laid out across the four sheets
          above.
        </p>
      </div>

      <div className="beta-turfy-pair">
        <div className="ledger beta-turfy-ledger">
          <div className="scroller" tabIndex={0} role="region" aria-label="Bill of materials">
            <table>
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {BOM.map((b) => (
                  <tr key={b.part}>
                    <td className="name">
                      <span className="beta-turfy-qty">{b.qty}×</span> {b.part}
                    </td>
                    <td>{b.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tbl-foot">
              <span>parts</span>
              <span>plus terminal blocks and a DIN enclosure</span>
            </div>
          </div>
        </div>

        <div className="ledger beta-turfy-ledger">
          <div className="scroller" tabIndex={0} role="region" aria-label="Raspberry Pi pin map">
            <table>
              <thead>
                <tr>
                  <th>Signal</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {PINS.map((p) => (
                  <tr key={p.gpio}>
                    <td className="name">
                      {p.signal}
                      <span className="beta-turfy-pin">GPIO {p.gpio}</span>
                    </td>
                    <td>{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tbl-foot">
              <span>pins</span>
              <span>BCM numbering</span>
            </div>
          </div>
        </div>
      </div>

      <div className="prose beta-sec">
        <h3>Acceptance test, before a valve is connected</h3>
      </div>
      <div className="beta-steps">
        <ol>
          {ACCEPTANCE.map((step, i) => (
            <li key={i}>
              <span className="beta-steps__n">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="prose beta-sec beta-turfy-end">
        <p>
          The rest of the hand-built pages are on the <Link href="/projects">projects index</Link>.
        </p>
      </div>
    </div>
  )
}
