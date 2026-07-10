import Link from "next/link"
import {
  ArrowLeft,
  Droplets,
  ShieldCheck,
  HeartPulse,
  Cpu,
  Zap,
  Eye,
  CloudRain,
  Gauge,
  CircuitBoard,
  AlertTriangle,
  Radio,
  PencilRuler,
} from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: "Rain Bird keeps authority",
    body:
      "The 1990s controller stays wired exactly as it is. Turfy is a sidecar on the station outputs — it never replaces the brain, it borrows it.",
  },
  {
    icon: HeartPulse,
    title: "A hardware dead-man",
    body:
      "A 555 missing-pulse watchdog must be fed by the daemon's own main loop every ~24s. Miss a beat and the transfer relays physically drop.",
  },
  {
    icon: Droplets,
    title: "Fail back to dumb",
    body:
      "Power loss, kernel panic, daemon hang, wedged I²C — every failure reverts to the Rain Bird with zero software involved. A stuck valve floods a yard; this can't stick.",
  },
]

const TEARDOWN = [
  {
    src: "/turfy/rainbird-faceplate.webp",
    alt: "Rain Bird ESP-6Si faceplate with its analog scheduling dial",
    tag: "The brief",
    cap: "Rain Bird ESP-6Si — an analog dial, six stations, an ‘Adjust Water %’ knob. About as simple as irrigation controllers get, which makes it perfect to augment rather than tap.",
  },
  {
    src: "/turfy/teardown-open.webp",
    alt: "The opened controller: green logic board over an orange power board, with a soldered-in lithium battery",
    tag: "Fully mapped",
    cap: "Inside: a 24VAC transformer, a COB micro, one triac per station, and a hobbyist coin-cell hack that holds the schedule through outages — i.e. what makes the fallback trustworthy.",
  },
  {
    src: "/turfy/teardown-power.webp",
    alt: "Power board showing station triacs TH1–TH8, red MOVs, a glass fuse and the field terminal block",
    tag: "The tap point",
    cap: "Power board (949-26330): eight station triacs TH1–TH8, per-output MOVs, and a fused 24VAC feed. Field wires land on this screw terminal — zone wires lift straight off, nothing gets cut.",
  },
  {
    src: "/turfy/teardown-cob.webp",
    alt: "COB daughtercard with epoxy-blob microcontroller and a station-count solder-jumper legend",
    tag: "The blob",
    cap: "COB daughtercard: the epoxy blob is the micro, and that S1/S2 jumper table is the 4/6/8-station config for the shared module. ‘OPEN:ACTIVE HIGH’ is the jumper-sense legend, not an I/O spec.",
  },
]

const BOOT = [
  "Pi boots. AUTHORITY GPIO defaults pull-down → Rain Bird stays in control regardless of any GPIO chatter.",
  "MCP23017 powers up all-inputs (POR default) → zone relays held off. Defined state, no init race.",
  "turfy.service self-checks (I²C ack, config sane, time synced), starts the heartbeat, then raises AUTHORITY.",
  "Watchdog charges within one timeout; the transfer bank engages and Turfy is driving.",
]

const FAILURES = [
  ["Pi power loss / kernel panic", "Heartbeat stops → watchdog drops → Rain Bird", true],
  ["Daemon crash or hang", "Same — the heartbeat is owned by the daemon loop", true],
  ["Pi reboot GPIO chatter", "AUTHORITY pull-down + MCP POR = no valve action", true],
  ["I²C bus wedge", "Daemon detects NAK → drops AUTHORITY", true],
  ["Relay 5V supply dies", "Transfer coils drop → Rain Bird", true],
  ["Both controllers fire one zone", "Harmless — shared transformer, same phase", true],
  ["Healthy daemon, latched zone", "Not caught by the watchdog → hard-capped by a per-zone max-runtime in the driver layer, plus flow-meter alarm in v0.2", false],
]

const ROADMAP = [
  {
    icon: Eye,
    phase: "Phase 0",
    title: "Passive learn",
    body:
      "An H11AA1 opto per station output logs when the Rain Bird actually waters. Validates zone mapping and collects a baseline schedule — zero risk, Turfy never asserts.",
    state: "instrumentation",
  },
  {
    icon: ShieldCheck,
    phase: "Phase 1",
    title: "Take authority",
    body:
      "Transfer relays + watchdog go live. Turfy replicates the dumb schedule first, proving the fail-safe handover with a meter before anything smart happens.",
    state: "the sidecar",
  },
  {
    icon: Gauge,
    phase: "Phase 2",
    title: "Flow metering",
    body:
      "An inline pulse flow meter learns each zone's baseline GPM — the killer feature. Detects stuck valves, broken heads (flow too high) and clogged lines (flow too low), per zone.",
    state: "closing the loop",
  },
  {
    icon: CloudRain,
    phase: "Phase 3",
    title: "Weather + vision",
    body:
      "ET-based scheduling (Penman-Monteith / Hargreaves) scales runtime to replace the daily deficit, minus rainfall. A cheap camera adds an NDVI-ish turf-stress index on top.",
    state: "the AI layer",
  },
]

const SHEETS = [
  {
    n: 1,
    src: "/turfy/sheet1.svg",
    title: "Power + valve path",
    cap: "24VAC tap → fuse + MOV → zone-bank relay → transfer-bank relay → valve solenoid. One channel of seven.",
  },
  {
    n: 2,
    src: "/turfy/sheet2.svg",
    title: "Watchdog + authority",
    cap: "The 555 missing-pulse detector (t ≈ 1.1·R·C ≈ 24 s) feeding the Q1/Q2 series-AND that sinks the transfer bank's authority bus.",
  },
  {
    n: 3,
    src: "/turfy/sheet3.svg",
    title: "Sense front-end",
    cap: "One H11AA1 AC-input opto per Rain Bird station output — the passive-logging phase. Typical of seven.",
  },
  {
    n: 4,
    src: "/turfy/sheet4.svg",
    title: "Zone drive",
    cap: "Pi I²C → MCP23017 (0x20) → zone-bank inputs. Power-on leaves every pin hi-Z, so relays stay off.",
  },
]

const BOM = [
  "2× 8-ch SPDT relay",
  "MCP23017",
  "NE555 + 2N3906",
  "2× 2N2222 AND",
  "7× H11AA1 sense",
  "1A fuse + 39V MOV",
  "Raspberry Pi",
]

export default function TurfyPage() {
  return (
    <div className="v3-turfy">
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 16 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-60px", top: "-30px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "160px", top: "220px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/projects" className="v3-air-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back to projects
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span
                className="v3-pill v3-pill--green"
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <Droplets size={14} strokeWidth={2.25} />
                turfy · irrigation sidecar · v0.1
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                An AI sprinkler brain that <span className="v3-accent">fails back to dumb.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Turfy is a weather-informed, camera-and-sensor irrigation controller — but the clever
                part isn&rsquo;t the AI, it&rsquo;s that it <strong>only touches your lawn when it&rsquo;s
                provably healthy</strong>. It rides alongside a 1990s Rain Bird as a fail-safe sidecar:
                take authority while the watchdog is fed, and hand control straight back the instant
                anything goes wrong. In hardware. Because a stuck valve is a flooded yard and a very
                large water bill.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* HERO IMAGE ===================================================== */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <figure className="v3-turfy-hero">
              <img src="/turfy/rainbird-faceplate.webp" alt="Rain Bird ESP-6Si controller faceplate" loading="eager" />
              <figcaption>
                The subject: a Rain Bird ESP-6Si. Reused, not replaced — Turfy borrows its transformer,
                its valves, and its job as the always-there fallback brain.
              </figcaption>
            </figure>
          </V3Reveal>
        </div>
      </section>

      {/* PRINCIPLES ==================================================== */}
      <section className="v3-section" style={{ paddingTop: 20 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <ShieldCheck size={18} strokeWidth={2.2} />
              <h2>Safe by construction</h2>
            </div>
          </V3Reveal>
          <div className="v3-turfy-principles">
            {PRINCIPLES.map((p, i) => (
              <V3Reveal key={p.title} delay={80 + i * 60}>
                <div className="v3-turfy-pcard">
                  <p.icon size={22} strokeWidth={2} className="v3-turfy-pcard__icon" />
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              </V3Reveal>
            ))}
          </div>
          <V3Reveal delay={280}>
            <div className="v3-turfy-invariant">
              <span className="v3-turfy-invariant__key">The invariant the whole design hangs on</span>
              <p>
                A de-energized transfer bank leaves the Rain Bird wired <em>exactly</em> as it is today.
                It&rsquo;s the first line of the acceptance test — proven with a continuity meter before
                anything is ever powered on.
              </p>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* ARCHITECTURE ================================================== */}
      <section className="v3-section" style={{ paddingTop: 28 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <CircuitBoard size={18} strokeWidth={2.2} />
              <h2>The transfer-switch architecture</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-turfy-lede">
              It&rsquo;s the classic automatic-transfer-switch pattern applied to sprinklers. An SPDT
              relay per zone: Rain Bird output on <strong>NC</strong>, Turfy output on <strong>NO</strong>,
              valve wire on the common pole. One authority line pulls the whole bank — unpowered,
              crashed, or watchdog-tripped, the relays drop and the Rain Bird is back in control.
            </p>
          </V3Reveal>
          <V3Reveal delay={140}>
            <div className="v3-turfy-flow">
              <div className="v3-turfy-flow__head">
                <span className="v3-turfy-dot" /> signal path · v0.1
              </div>
              <div className="v3-turfy-flow__body">
                <div className="v3-turfy-flow__inputs">
                  <div className="v3-turfy-nd v3-turfy-nd--fb">
                    <span className="v3-turfy-nd__k">fallback</span>
                    <span className="v3-turfy-nd__t">Rain Bird ESP-6Si</span>
                    <span className="v3-turfy-nd__w">on&nbsp;NC</span>
                  </div>
                  <div className="v3-turfy-nd v3-turfy-nd--sm">
                    <span className="v3-turfy-nd__k">smart path</span>
                    <span className="v3-turfy-nd__t">Pi → MCP23017 → zone bank</span>
                    <span className="v3-turfy-nd__w">on&nbsp;NO</span>
                  </div>
                </div>
                <span className="v3-turfy-flow__ar" aria-hidden>→</span>
                <div className="v3-turfy-nd v3-turfy-nd--hub">
                  <span className="v3-turfy-nd__k">transfer bank</span>
                  <span className="v3-turfy-nd__t">8× SPDT relay</span>
                  <span className="v3-turfy-nd__s">one authority line picks NC or NO</span>
                </div>
                <span className="v3-turfy-flow__ar" aria-hidden>→</span>
                <div className="v3-turfy-nd v3-turfy-nd--out">
                  <span className="v3-turfy-nd__k">field · COM</span>
                  <span className="v3-turfy-nd__t">Valves 1–6 + MV</span>
                </div>
              </div>
              <div className="v3-turfy-flow__gate">
                <span className="v3-turfy-flow__gk">authority ⇢ picks the bank · active-low</span>
                <div className="v3-turfy-nd v3-turfy-nd--wd">555 watchdog</div>
                <span className="v3-turfy-flow__op">∧</span>
                <div className="v3-turfy-nd v3-turfy-nd--gpio">Pi GPIO17</div>
                <span className="v3-turfy-flow__ar v3-turfy-flow__ar--sm" aria-hidden>←</span>
                <span className="v3-turfy-flow__hb">heartbeat · daemon loop · ~24&nbsp;s</span>
              </div>
            </div>
          </V3Reveal>
          <div className="v3-turfy-rule">
            <AlertTriangle size={16} strokeWidth={2.3} />
            <p>
              <strong>The one rule that must survive every revision:</strong> never run a second 24VAC
              transformer while the NC path to the Rain Bird exists. Out-of-phase secondaries through
              the transfer relay = circulating current and dead triacs. Turfy steals 24VAC from the
              Rain Bird&rsquo;s own terminals so both controllers switch the same hot leg.
            </p>
          </div>
        </div>
      </section>

      {/* BUILD SHEETS ================================================== */}
      <section className="v3-section" style={{ paddingTop: 28 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <PencilRuler size={18} strokeWidth={2.2} />
              <h2>The four build sheets</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-turfy-lede">
              The schematic is parametric <code>schemdraw</code> source — so when a board photo
              tells us something (no MV terminal, a shorter timeout), it&rsquo;s a one-line edit and
              re-render, not a redraw.
            </p>
          </V3Reveal>
          <div className="v3-turfy-sheets">
            {SHEETS.map((s, i) => (
              <V3Reveal key={s.n} delay={100 + i * 50}>
                <figure className="v3-turfy-blueprint">
                  <span className="v3-turfy-blueprint__tag">Sheet {s.n}</span>
                  <img src={s.src} alt={`Turfy schematic — sheet ${s.n}: ${s.title}`} loading="lazy" />
                  <figcaption>
                    <strong>{s.title}.</strong> {s.cap}
                  </figcaption>
                </figure>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TEARDOWN ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 28 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Cpu size={18} strokeWidth={2.2} />
              <h2>Reverse-engineering the box</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-turfy-lede">
              Before you can sidecar a sealed 1990s controller, you have to map it. Board by board:
              what&rsquo;s the tap point, where does 24VAC come from, and is the fallback actually
              trustworthy?
            </p>
          </V3Reveal>
          <div className="v3-turfy-gallery">
            {TEARDOWN.map((t, i) => (
              <V3Reveal key={t.src} delay={100 + i * 60}>
                <figure className="v3-turfy-shot">
                  <div className="v3-turfy-shot__frame">
                    <img src={t.src} alt={t.alt} loading="lazy" />
                    <span className="v3-turfy-shot__tag">{t.tag}</span>
                  </div>
                  <figcaption>{t.cap}</figcaption>
                </figure>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY CORE =================================================== */}
      <section className="v3-section" style={{ paddingTop: 28 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <HeartPulse size={18} strokeWidth={2.2} />
              <h2>The safety core</h2>
            </div>
          </V3Reveal>

          <div className="v3-turfy-core">
            <V3Reveal delay={80}>
              <blockquote className="v3-turfy-quote">
                &ldquo;The heartbeat must prove <em>application</em> liveness, not kernel liveness.&rdquo;
                <span>
                  So it&rsquo;s toggled from the daemon main loop — never cron, never hardware PWM. A
                  cron job would keep ticking after a crash and defeat the entire point.
                </span>
              </blockquote>
            </V3Reveal>

            <V3Reveal delay={140}>
              <div className="v3-turfy-authority">
                <h3>
                  <Zap size={15} strokeWidth={2.4} /> Authority = liveness ∧ intent
                </h3>
                <p>
                  Two 2N2222s in series pull the transfer bank low. It engages only when the 555
                  says the daemon is alive <em>and</em> the Pi explicitly asserts yes. Either transistor
                  off → the line floats high → the bank drops → Rain Bird.
                </p>
                <code className="v3-turfy-formula">
                  authority ⇔ (heartbeat alive) ∧ (Pi says yes)
                </code>
              </div>
            </V3Reveal>
          </div>

          <V3Reveal delay={180}>
            <div className="v3-turfy-boot">
              <span className="v3-turfy-boot__label">Boot sequence — safe at every step</span>
              <ol>
                {BOOT.map((step, i) => (
                  <li key={i}>
                    <span className="v3-turfy-boot__n">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* FAILURE TABLE ================================================= */}
      <section className="v3-section" style={{ paddingTop: 28 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <AlertTriangle size={18} strokeWidth={2.2} />
              <h2>Every way it can fail</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <div className="v3-turfy-tablewrap">
              <table className="v3-turfy-table">
                <thead>
                  <tr>
                    <th>Failure</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {FAILURES.map(([f, r, safe]) => (
                    <tr key={f as string} className={safe ? "" : "v3-turfy-table__hole"}>
                      <td>{f}</td>
                      <td>
                        <span className="v3-turfy-safe" data-safe={safe ? "1" : "0"}>
                          {safe ? "fails safe" : "software invariant"}
                        </span>
                        {r}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* ROADMAP ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 28 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Radio size={18} strokeWidth={2.2} />
              <h2>Validate each layer</h2>
            </div>
          </V3Reveal>
          <div className="v3-turfy-roadmap">
            {ROADMAP.map((r, i) => (
              <V3Reveal key={r.phase} delay={80 + i * 60}>
                <div className="v3-turfy-phase">
                  <div className="v3-turfy-phase__head">
                    <r.icon size={20} strokeWidth={2} />
                    <div>
                      <span className="v3-turfy-phase__label">{r.phase}</span>
                      <h3>{r.title}</h3>
                    </div>
                  </div>
                  <p>{r.body}</p>
                  <span className="v3-turfy-phase__state">{r.state}</span>
                </div>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER ======================================================= */}
      <section className="v3-section" style={{ paddingTop: 20, paddingBottom: 48 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-turfy-foot">
              <div>
                <span className="v3-turfy-foot__eyebrow">v0.1 build package</span>
                <p>
                  Two stock relay boards, an MCP23017 for defined power-on state, a 555 watchdog, and
                  an H11AA1 sense bank — a parametric <code>schemdraw</code> source renders the four
                  schematic sheets, so a board photo becomes a one-line edit and re-render.
                </p>
              </div>
              <div className="v3-turfy-bom">
                {BOM.map((b) => (
                  <span key={b} className="v3-turfy-chip">{b}</span>
                ))}
              </div>
            </div>
          </V3Reveal>
        </div>
      </section>
    </div>
  )
}
