import Link from "next/link"
import { LiveEye } from "@/components/meatball/LiveEye"
import { Greeter } from "@/components/meatball/Greeter"
import { MotionTrack } from "@/components/meatball/MotionTrack"
import { EarsTrack } from "@/components/meatball/EarsTrack"

const RIG: { junk: string; role: string }[] = [
  { junk: "No case at all", role: "open-air on the bench, a body you can reach into" },
  { junk: "Two old GPUs", role: "run the local LLM, Whisper STT, and a neural voice, on the metal" },
  { junk: "20 assorted second-hand external drives", role: "the memory" },
  { junk: "A pile of Plantronics ADACs from an abandoned office", role: "the audio lanes: speaker and mics over USB" },
  { junk: "An old factory start/stop button", role: "the power switch" },
  { junk: "Altec Lansing speakers, early '90s", role: "the mouth" },
  { junk: "A mic from my grandfather's garage, '60s", role: "an ear" },
  { junk: "A Realistic condenser mic, Salvation Army", role: "another ear" },
  { junk: "A baseless Salvation Army monitor", role: "the display" },
  { junk: "Scrounged Logitech webcams", role: "the eyes, and it turned out the best ears too" },
]

const SENSES = [
  {
    label: "Eyes",
    body: "Two scrounged webcams. One grabs a frame a minute and serves it live; the vision model narrates what is in front of it.",
    href: "/eyes",
  },
  {
    label: "Ears",
    body: "A '60s garage mic, a thrift-store condenser, and the webcam mics, feeding a local Whisper that transcribes the room.",
    href: null,
  },
  {
    label: "Mouth",
    body: "Early-'90s Altec Lansings driven by a local neural voice. First word lands in about a third of a second.",
    href: null,
  },
  {
    label: "Brain",
    body: "A local LLM on two old GPUs, plus a self-calibrating audio rig. No keys, no cloud, ever.",
    href: null,
  },
]

const ENTRIES = [
  {
    href: "/meatball/notes/senses",
    kicker: "field note 01",
    title: "I gave a junk-pile eyes, ears, and a voice",
    blurb:
      "The whole saga: the salvaged bill of materials, the debugging traps that cost an hour each, the calibration insight, and finally talking to the WOPR out loud.",
  },
  {
    href: "/meatball/notes/listening",
    kicker: "field note 02",
    title: "The math of listening",
    blurb:
      "Low-level DSP from raw samples to a working voice gate: the real FFT, windowing (200x less leakage), spectral-subtraction denoise and its U-curve. Every number from a live run.",
  },
  {
    href: "/meatball/notes/motion",
    kicker: "field note 03",
    title: "Teaching the eyes to ignore a box fan",
    blurb:
      "One cheap fan fooled both senses. Locking the camera's auto-exposure, then an adaptive per-cell gate that self-mutes the fan, the monitors and lighting blips, so it only fires on what should not move.",
  },
]

export default function MeatballPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Meatball</span>
          </span>
        </nav>
        <h1>Meatball can see, hear, and talk back</h1>
      </div>

      <p className="lede">
        A caseless home server built from other people&apos;s cast-offs: salvaged GPUs, an
        abandoned-office pile of audio dongles, a &apos;60s microphone, early-&apos;90s speakers.
        Taught to see, hear, think and speak. Every model runs on the metal and nothing touches the
        cloud.
      </p>

      <div className="prose beta-sec">
        <h2>What it can see right now</h2>
      </div>
        <LiveEye />

      <div className="prose beta-sec">
        <h2>It can just ask</h2>
      </div>
        <Greeter />

      <div className="prose beta-sec">
        <h2>It tracks its own motion</h2>
      </div>
        <MotionTrack />

      <div className="prose beta-sec">
        <h2>Always-on ears</h2>
      </div>
        <EarsTrack />

      <div className="prose beta-sec">
        <h2>Four cast-off parts, four working senses</h2>
      </div>

      <div className="piece-grid">
        {SENSES.map((s) => (
          <div className="rail" key={s.label}>
            <h3>{s.label}</h3>
            <p>{s.body}</p>
            {s.href && (
              <p>
                <Link className="btn" href={s.href}>
                  See it live
                </Link>
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="prose beta-sec">
        <h2>The bill of materials</h2>
        <p>Nothing here was bought new for this.</p>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Bill of materials">
          <table>
            <thead>
              <tr>
                <th>The junk</th>
                <th>What it became</th>
              </tr>
            </thead>
            <tbody>
              {RIG.map((r) => (
                <tr key={r.junk}>
                  <td className="name">{r.junk}</td>
                  <td>{r.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>{RIG.length} salvaged parts</span>
          </div>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Written up as it was built</h2>
      </div>

      <ul className="rail-list">
        {ENTRIES.map((e) => (
          <li key={e.href}>
            <Link href={e.href}>{e.title}</Link>
            <span>
              {e.kicker}. {e.blurb}
            </span>
          </li>
        ))}
      </ul>

      <p className="quiet">
        <Link href="/meatball/log">The event log</Link> ·{" "}
        <Link href="/meatball/memory">What it remembers</Link>
      </p>
    </div>
  )
}
