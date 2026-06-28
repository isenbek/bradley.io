import Link from "next/link"
import { Eye, Ear, Speaker, Brain, ArrowRight, BookOpen, ScrollText } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { LiveEye } from "@/components/meatball/LiveEye"
import { Greeter } from "@/components/meatball/Greeter"
import { MotionTrack } from "@/components/meatball/MotionTrack"
import { EarsTrack } from "@/components/meatball/EarsTrack"

// The salvaged rig — junk on the left, the sense it became on the right.
const RIG: { junk: string; role: string }[] = [
  { junk: "No case at all", role: "open-air on the bench — a body you can reach into" },
  { junk: "Two old GPUs", role: "run the local LLM, Whisper STT, and a neural voice — on the metal" },
  { junk: "20 assorted second-hand external drives", role: "the memory" },
  { junk: "A pile of Plantronics ADACs from an abandoned office", role: "the audio lanes — speaker + mics over USB" },
  { junk: "An old factory start/stop button", role: "the power switch" },
  { junk: "Altec Lansing speakers, early '90s", role: "the mouth" },
  { junk: "A mic from my grandfather's garage, '60s", role: "an ear" },
  { junk: "A Realistic condenser mic, Salvation Army", role: "another ear" },
  { junk: "A baseless Salvation Army monitor", role: "the display" },
  { junk: "Scrounged Logitech webcams", role: "the eyes — and, it turned out, the best ears too" },
]

const SENSES = [
  { icon: Eye, label: "Eyes", body: "Two scrounged webcams. One grabs a frame a minute and serves it live; the vision model narrates what's in front of it.", href: "/eyes", cta: "see live" },
  { icon: Ear, label: "Ears", body: "A '60s garage mic, a thrift-store condenser, and the webcam mics — feeding a local Whisper that transcribes the room.", href: null, cta: null },
  { icon: Speaker, label: "Mouth", body: "Early-'90s Altec Lansings driven by a local neural voice. First word lands in about a third of a second.", href: null, cta: null },
  { icon: Brain, label: "Brain", body: "A local LLM on two old GPUs, plus a self-calibrating audio rig. No keys, no cloud, ever.", href: null, cta: null },
]

// Field notes — the blog index. New entries slot in here.
const ENTRIES = [
  {
    href: "/lab/senses",
    kicker: "field note · 01",
    title: "I gave a junk-pile eyes, ears, and a voice",
    blurb: "The whole saga: the salvaged bill of materials, the debugging traps that cost an hour each, the calibration insight, and — finally — talking to the WOPR out loud.",
  },
  {
    href: "/lab/listening",
    kicker: "field note · 02",
    title: "The math of listening",
    blurb: "Low-level DSP from raw samples to a working voice gate: the real FFT, windowing (200× less leakage), spectral-subtraction denoise and its U-curve. Every number from a live run.",
  },
]

export default function MeatballPage() {
  return (
    <div className="v3-longform v3-meatball">
      {/* HERO ========================================================== */}
      <header className="v3-page-head" style={{ paddingBottom: 12 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ left: "-90px", top: "-30px", width: 340, height: 340 }} />
        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <div className="v3-mb-hero">
              <div className="v3-mb-hero__text">
                <V3Reveal>
                  <span className="v3-pill v3-pill--gold" style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
                    🍖 project · the sensory machine
                  </span>
                </V3Reveal>
                <V3Reveal eager>
                  <h1>
                    Meatball <span className="v3-accent">can see, hear, and talk back.</span>
                  </h1>
                </V3Reveal>
                <V3Reveal eager>
                  <p className="v3-page-head__lede">
                    A caseless home server built from other people&apos;s cast-offs — salvaged GPUs, an
                    abandoned-office pile of audio dongles, a &apos;60s microphone, early-&apos;90s speakers — taught to
                    see, hear, think, and speak. Every model runs on the metal. Nothing touches the cloud.
                    This is its home.
                  </p>
                </V3Reveal>
              </div>
              <img
                className="v3-mb-hero__mascot"
                src="/meatball-mascot.png"
                width={512}
                height={279}
                alt="Meatball — a grinning ball of salvaged electronics with cable arms, waving hello"
              />
            </div>
          </div>
        </div>
      </header>

      {/* LIVE EYE ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <V3Reveal><LiveEye /></V3Reveal>
        </div>
      </section>

      {/* GREETER — the presence probe ================================= */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 16 }}>
              <div className="v3-sec-head__num">is anyone there?</div>
              <h2 style={{ marginBottom: 0 }}>It can just ask.</h2>
            </div>
          </V3Reveal>
          <V3Reveal><Greeter /></V3Reveal>
        </div>
      </section>

      {/* MOTION TRACKER =============================================== */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 16 }}>
              <div className="v3-sec-head__num">what&apos;s moving</div>
              <h2 style={{ marginBottom: 0 }}>It tracks its own motion.</h2>
            </div>
          </V3Reveal>
          <V3Reveal><MotionTrack /></V3Reveal>
          <V3Reveal>
            <Link href="/meatball/log" className="v3-espace-cta" style={{ marginTop: 16 }}>
              <ScrollText size={15} strokeWidth={2.4} /> the logbook — what it noticed <span aria-hidden>→</span>
            </Link>
          </V3Reveal>
        </div>
      </section>

      {/* EARS ========================================================= */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 16 }}>
              <div className="v3-sec-head__num">what&apos;s listening</div>
              <h2 style={{ marginBottom: 0 }}>Always-on ears.</h2>
            </div>
          </V3Reveal>
          <V3Reveal><EarsTrack /></V3Reveal>
          <V3Reveal>
            <Link href="/meatball/memory" className="v3-espace-cta" style={{ marginTop: 16 }}>
              <Brain size={15} strokeWidth={2.4} /> the memory — moments lined up <span aria-hidden>→</span>
            </Link>
          </V3Reveal>
        </div>
      </section>

      {/* THE SENSES =================================================== */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 20 }}>
              <div className="v3-sec-head__num">the senses</div>
              <h2 style={{ marginBottom: 0 }}>Four cast-off parts, four working senses.</h2>
            </div>
          </V3Reveal>
          <div className="v3-meatball-senses">
            {SENSES.map((s, i) => {
              const Icon = s.icon
              const inner = (
                <>
                  <span className="v3-meatball-sense__ico"><Icon size={20} strokeWidth={2.2} /></span>
                  <span className="v3-meatball-sense__label">{s.label}</span>
                  <span className="v3-meatball-sense__body">{s.body}</span>
                  {s.cta ? <span className="v3-meatball-sense__cta">{s.cta} <ArrowRight size={13} strokeWidth={2.6} /></span> : null}
                </>
              )
              return (
                <V3Reveal key={s.label} delay={i * 70}>
                  {s.href ? (
                    <Link href={s.href} className="v3-meatball-sense v3-meatball-sense--link">{inner}</Link>
                  ) : (
                    <div className="v3-meatball-sense">{inner}</div>
                  )}
                </V3Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* BILL OF MATERIALS =========================================== */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 20 }}>
              <div className="v3-sec-head__num">the build</div>
              <h2 style={{ marginBottom: 0 }}>The bill of materials.</h2>
            </div>
          </V3Reveal>
          <V3Reveal>
            <div className="v3-senses-rig">
              <div className="v3-senses-rig__head">salvaged → repurposed</div>
              <ul className="v3-senses-rig__list">
                {RIG.map((r) => (
                  <li key={r.junk} className="v3-senses-rig__row">
                    <span className="v3-senses-rig__junk">{r.junk}</span>
                    <span className="v3-senses-rig__arrow" aria-hidden>→</span>
                    <span className="v3-senses-rig__role">{r.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* FIELD NOTES (blog index) ==================================== */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 20 }}>
              <div className="v3-sec-head__num">field notes</div>
              <h2 style={{ marginBottom: 0 }}>Written up as it was built.</h2>
            </div>
          </V3Reveal>
          <div className="v3-meatball-notes">
            {ENTRIES.map((e, i) => (
              <V3Reveal key={e.href} delay={i * 70}>
                <Link href={e.href} className="v3-meatball-note">
                  <span className="v3-meatball-note__ico"><BookOpen size={18} strokeWidth={2.2} /></span>
                  <span className="v3-meatball-note__body">
                    <span className="v3-meatball-note__kicker">{e.kicker}</span>
                    <span className="v3-meatball-note__title">{e.title}</span>
                    <span className="v3-meatball-note__blurb">{e.blurb}</span>
                  </span>
                  <ArrowRight className="v3-meatball-note__arrow" size={18} strokeWidth={2.4} />
                </Link>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
