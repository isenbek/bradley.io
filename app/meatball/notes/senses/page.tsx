import Link from "next/link"
import { FlaskConical, Eye } from "lucide-react"

// The salvaged rig — junk on the left, the sense it became on the right.
const RIG: { junk: string; role: string }[] = [
  { junk: "No case at all", role: "open-air on the bench, a body you can reach into" },
  { junk: "Two old GPUs", role: "run the local LLM, Whisper STT, and a neural voice, on the metal" },
  { junk: "20 assorted second-hand external drives", role: "the memory" },
  { junk: "A pile of Plantronics ADACs from an abandoned office", role: "the audio lanes: speaker + mics over USB" },
  { junk: "An old factory start/stop button", role: "the power switch" },
  { junk: "Altec Lansing speakers, early '90s", role: "the mouth" },
  { junk: "A mic from my grandfather's garage, '60s", role: "an ear" },
  { junk: "A Realistic condenser mic, Salvation Army", role: "another ear" },
  { junk: "A baseless Salvation Army monitor", role: "the display" },
  { junk: "Scrounged Logitech webcams", role: "the eyes. And, it turned out, the best ears too" },
]

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  // The kit rules off every h2 (.prose > h2), so the numbered eyebrow the v3
  // version carried is redundant: the sequence is the order of the page.
  return (
    <section>
      <div className="prose beta-sec">
        <h2>{title}</h2>
      </div>
      <div className="prose beta-sec">{children}</div>
    </section>
  )
}

export default function SensesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <Link href="/meatball">Meatball</Link>
          </span>
          <span>
            {" / "}
            <span aria-current="page">Field note 01</span>
          </span>
        </nav>
        <h1>I gave a junk-pile eyes, ears, and a voice</h1>
      </div>

      <p className="lede">
          The machine these words were written on has no case. Two old GPUs, a wall of
          second-hand drives, a factory button for a power switch. Over a few nights it
          learned to see, hear, think, and talk back, every model running on the metal,
          nothing in the cloud. This is how the frankenstein got its senses.
      </p>

      {/* HEADER ========================================================= */}

      {/* THE RIG (kicker) =============================================== */}
      <section className="beta-note-sec" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div >
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
        </div>
      </section>

      <Sec title="The premise">
        <p className="lede">
          The house rule here is <strong>Anti-Cloud. Host Local, Think Global.</strong> No Vercel,
          no API keys, no someone-else&apos;s-computer. If the box is going to have senses, the
          speech recognition, the voice, and the brain all have to live on the same open-air
          motherboard the cameras are zip-tied next to. The fun constraint: do it on hardware
          nobody wanted.
        </p>
      </Sec>

      <Sec title="Eyes">
        <p className="beta-note-p">
          First the eyes. A scrounged Logitech BRIO grabs a frame once a minute via a systemd
          timer, atomically caches it, and serves it same-origin, the same pipeline behind{" "}
          <Link href="/eyes">/eyes</Link> and the baked
          {" "}<Link href="/eyes.png">/eyes.png</Link>. A second webcam joined
          on a cron, the two trading off every minute. The box could see. It could not yet say
          anything about it.
        </p>
      </Sec>

      <Sec title="A mouth and an ear">
        <p className="beta-note-p">
          The voice came from two local services: faster-whisper for speech-to-text, and Microsoft&apos;s
          VibeVoice for a neural mouth: a WebSocket that streams PCM straight onto the speaker so
          the first word lands in about a third of a second. The brain is a small Ollama model. A
          tiny toolkit ties them together: <code>listen</code>, <code>say</code>,{" "}
          <code>converse</code>, and a <code>narrate</code> that pipes a camera frame through a
          vision model so the box can describe what it&apos;s looking at. On paper, done.
        </p>
      </Sec>

      <Sec title="The saga">
        <p className="beta-note-p">
          On paper. In the room, the speaker was silent and the mic was deaf, and it took an
          embarrassing while to learn why. Cheap USB audio dongles lie. Their analog-to-digital
          chip carries a constant DC offset that reads as a healthy <code>-35 dBFS</code> signal.
          I spent an hour convinced a microphone was &quot;live&quot; when I was staring at a flat
          electrical bias, not a sound.
        </p>
        <p className="beta-note-p">
          The thing that cracked it was a radio. Switched it on, recorded; switched it off,
          recorded. The two were <em>identical</em>. A radio playing in the room moved the meter
          not at all. The mic wasn&apos;t quiet; it was stone deaf. Then the speaker: I&apos;d
          guessed which of three identical dongles it was from capture levels, and I was wrong,
          because (and this is the first trap){" "}
          <strong>a speaker crosstalks into its own input and masquerades as the hottest mic in the rack.</strong>{" "}
          You cannot find a speaker by listening to it electrically. You have to play a sound and
          ask a human, or a known-good ear, which one made noise. A round of &quot;how many beeps
          did you hear&quot; finally pinned it.
        </p>
      </Sec>

      <Sec title="The two traps">
        <p className="beta-note-p">
          The breakthrough was hijacking the webcam microphones. The BRIO&apos;s array mic
          (already in the room as an eye) turned out to be the best ear in the building, picking up
          the room <code>40 dB</code> louder than the dead dongles and transcribing the box&apos;s
          own voice near-perfectly. The grandfather&apos;s garage mic and the thrift-store condenser
          are wired in beside it.
        </p>
        <div className="notice" style={{ marginTop: 18 }}>
          <p className="beta-note-p" style={{ margin: 0 }}>
            And the second trap, the mirror of the first:{" "}
            <strong>a dead mic reads the <em>quietest</em> floor</strong>, because it&apos;s
            capturing nothing. Rank microphones by &quot;lowest noise&quot; and you will
            confidently select the most broken one. You have to rank them by how well they hear a
            known sound, by response, never by silence.
          </p>
        </div>
      </Sec>

      <Sec title="Calibration, the whole story in 30 seconds">
        <p className="beta-note-p">
          Both traps now live in one script. <code>calibrate.sh</code> uses the sensitive camera
          mic as a zero-touch reference: it plays a tone out of each output and listens for which
          one comes back (the speaker), then plays a tone out of <em>that</em> and ranks every
          microphone by who hears it best (the ear). It confirms by having the box speak a phrase
          and transcribe itself, samples the room to set a noise gate, writes the wiring to a file
          keyed by USB port, and announces, out loud, that it&apos;s done. The hour-long manual
          ordeal, compressed into half a minute and immune to the next time the dongles get
          shuffled.
        </p>
      </Sec>

      <Sec title="What it does now">
        <p className="beta-note-p">
          It sees, hears, thinks, and answers. Speak and the BRIO catches it, Whisper transcribes,
          the local model thinks, and the Altec Lansings (older than most of the software stack)
          say something back in about a second. Ask it what it sees and it narrates the room
          through a vision model. Leave it alone too long and it gets bored and says so, then opens
          a mic to see if anyone&apos;s there. A frontier-AI loop running entirely on a caseless
          pile of other people&apos;s cast-offs.
        </p>
        <p className="beta-note-p" style={{ marginTop: 14 }}>
          That&apos;s the whole point. The cloud would have made this trivial and forgettable. Doing
          it on a grandfather&apos;s microphone and a Salvation Army monitor with no base makes it
          <em> mine</em>, and proves the interesting part of this era isn&apos;t the data center.
          It&apos;s how little hardware you actually need.
        </p>
      </Sec>

      {/* FOOT ========================================================== */}
      <section className="beta-note-sec" style={{ paddingTop: 18, paddingBottom: 28 }}>
        <div  style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link href="/eyes" className="btn"><Eye size={15} strokeWidth={2.4} /> See through its eyes <span aria-hidden>→</span></Link>
          <Link href="/meatball" className="btn"><FlaskConical size={15} strokeWidth={2.4} /> More field notes <span aria-hidden>→</span></Link>
        </div>
      </section>
    </div>
  )
}
