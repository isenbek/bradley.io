import Link from "next/link"
import { LiveEye } from "@/components/meatball/LiveEye"
import { Greeter } from "@/components/meatball/Greeter"
import { MotionTrack } from "@/components/meatball/MotionTrack"
import { EarsTrack } from "@/components/meatball/EarsTrack"
import { PageHead, Section } from "@/components/page"

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
    body: "Two scrounged webcams. One grabs a frame a minute and serves the newest. The vision model narrates what is in front of it.",
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
      "The whole build: the salvaged parts list, the bugs that cost an hour each, and the day it first talked back.",
  },
  {
    href: "/meatball/notes/listening",
    kicker: "field note 02",
    title: "The math of listening",
    blurb:
      "How a computer tells a voice from background noise, worked from the raw sound samples up. Every number comes from a live run.",
  },
  {
    href: "/meatball/notes/motion",
    kicker: "field note 03",
    title: "Teaching the eyes to ignore a box fan",
    blurb:
      "One cheap fan fooled both the eyes and the ears. The fix taught the camera to ignore things that always move, like fans, screens and flickering lights, and notice only what should not.",
  },
]

export default function MeatballPage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Meatball" }]}
        title="Meatball can see, hear, and talk back"
        lede={
          <>
            A home server with no case, built from other people&apos;s cast-offs: salvaged graphics
            cards, a pile of USB audio adapters from an abandoned office, a &apos;60s microphone and
            early-&apos;90s speakers. It was taught to see, hear, think and speak. Every AI model
            runs on the machine itself, and nothing touches the cloud.
          </>
        }
      />

      <Section title="What it sees" />
      <LiveEye />

      <Section title="It can just ask" />
      <Greeter />

      <Section title="It tracks its own motion" />
      <MotionTrack />

      <Section title="Always-on ears" />
      <EarsTrack />

      <Section title="Four cast-off parts, four working senses" />

      <div className="piece-grid">
        {SENSES.map((s) => (
          <div className="rail" key={s.label}>
            <h3>{s.label}</h3>
            <p>{s.body}</p>
            {s.href && (
              <p>
                <Link className="btn" href={s.href}>
                  See the frame
                </Link>
              </p>
            )}
          </div>
        ))}
      </div>

      <Section title="The bill of materials">
        <p>Nothing here was bought new for this.</p>
      </Section>

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

      <Section id="notes" title="Written up as it was built" />

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
