import Link from "next/link"
import { BookOpen, Eye } from "lucide-react"

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

function Code({ cap, children }: { cap?: string; receipt?: boolean; children: string }) {
  // The kit's .code styles a <pre> child (".code pre" carries the padding);
  // a bare <code> gets neither padding nor preserved whitespace, which is why
  // these first rendered as flat bars with the text collapsed onto the caption.
  //
  // `receipt` is accepted and ignored: it selected a green-on-black variant the
  // kit has no counterpart for. The kit has one code surface, on panel, because
  // a second would be a level somebody invented.
  return (
    <div className="code">
      {cap ? <div className="beta-code-cap">{cap}</div> : null}
      <pre>{children}</pre>
    </div>
  )
}

export default function MotionPage() {
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
            <span aria-current="page">Field note 03</span>
          </span>
        </nav>
        <h1>Teaching the eyes to ignore a box fan</h1>
      </div>

      <p className="lede">
          A $20 box fan fooled both of Meatball&apos;s senses at once: it hissed on the mic and it
          waved at the camera, and the camera kept reporting &quot;someone&apos;s here.&quot; The fix
          is a small lesson in where the leverage actually is: never on the picture you can see,
          always upstream of it or in the rule that reads it.
      </p>

      {/* HEADER ======================================================== */}

      <section className="beta-note-sec" style={{ paddingTop: 4, paddingBottom: 8 }}>
        <div >
          <Code cap="the motion pipeline, after the fix">{`lock the camera → grab → diff vs. last frame → per-cell adaptive gate → blob → trigger`}</Code>
        </div>
      </section>

      <Sec title="One fan, two fooled senses">
        <p className="lede">
          Meatball watches for motion the obvious way: every ~10 seconds it grabs a frame from each
          camera, subtracts the previous one, and scores how much changed across a 32×18 grid. A bright
          region in the difference means something moved. Simple, cheap, and (with a box fan in the
          room) wrong constantly. The blades are <em>always</em> in a new position, so the fan&apos;s
          corner of the frame lights up every single tick. To a plain frame-differ, a spinning fan and
          a walking person are the same event.
        </p>
        <p className="beta-note-p">
          The same fan had already shown up on the other sense. When we re-measured the microphones, one
          mic&apos;s noise floor had jumped <strong>24&nbsp;dB</strong> (from −41&nbsp;dBFS to
          −17) and its gain was pinned at the maximum, 255. That was the fan&apos;s draft and hum, and a
          gained-up sensor amplifying it. One cheap appliance, both senses saturated.
        </p>
        <Code cap="the noise floor that gave it away" receipt>{`brio mic        floor −41.1 dBFS   spread 0.9 dB   quiet, stable
quickcam mic    floor −17.3 dBFS   spread 4.0 dB   ← +24 dB: the fan
quickcam gain   255 / 255          maxed → amplifying its own room noise`}</Code>
      </Sec>

      <Sec title="Why you can't just turn up the contrast">
        <p className="beta-note-p">
          The first instinct is to stretch the difference image: &quot;the motion&apos;s faint, boost
          it.&quot; It doesn&apos;t help, and it&apos;s worth knowing exactly why. The difference is dark
          because most of the frame genuinely <em>didn&apos;t</em> change. That&apos;s correct. Multiply
          it and you scale the real motion <strong>and</strong> the sensor speckle and the lighting
          residual by the same factor. The signal-to-noise ratio is unchanged; you&apos;ve just moved
          the numbers around and made the threshold harder to place.
        </p>
        <p className="beta-note-p">
          All the leverage is somewhere else: <strong>upstream of the subtraction</strong> (stop the bad
          change from entering the frame) or <strong>in the decision rule</strong> (be smarter about
          which changes count). Never on the delta itself. So we did both.
        </p>
      </Sec>

      <Sec title="Two different lies need two different fixes">
        <p className="beta-note-p">
          The false triggers came from two genuinely different causes, and no single trick fixes both,
          which is exactly why naïve approaches flail.
        </p>
        <Code cap="the two failure modes">{`cause                       nature                         fix
─────────────────────────   ────────────────────────────   ───────────────────────
auto-exposure / white-bal   photometric: the scene         lock it at the source
re-metering (a light, a       didn't move, the camera         (camera controls)
bright shirt walks in)        re-mapped brightness
─────────────────────────   ────────────────────────────   ───────────────────────
the fan, the monitors        real pixel change, just         a smarter decision rule
                              not the change you care about   (adaptive per-cell gate)`}</Code>
        <p className="beta-note-p">
          No brightness trick fixes a re-metering camera; no camera setting fixes a fan. You want one of
          each.
        </p>
      </Sec>

      <Sec title="Fix one, kill it at the source: lock the camera">
        <p className="beta-note-p">
          A webcam left on auto re-meters constantly. Auto-exposure rebalances when a screen flickers or
          something bright enters frame; auto-white-balance shifts the whole color map; continuous
          autofocus hunts. Every one of those is a <em>whole-frame</em> change you then have to fight in
          software. The cameras expose a whole galaxy of these knobs over v4l2 (29 of them across the
          two we run) and the cure is to stop the automatic ones from moving.
        </p>
        <Code cap="the stable profile: pin the autos, freeze the picture">{`auto_exposure              → Manual      (was: Aperture-Priority)
white_balance_automatic    → off
exposure_dynamic_framerate → off
focus_automatic_continuous → off
then PIN exposure / white-balance / focus / gain to whatever
auto had just chosen, so the picture doesn't visibly jump,
it just stops hunting.`}</Code>
        <p className="beta-note-p">
          The trick in that last line matters: we read what auto-exposure currently landed on and write
          it back as the fixed manual value. The image looks identical the instant before and after.
          The only thing that changes is that it stops chasing the room. The doc that started this
          called locking the camera &quot;the biggest single win, zero compute,&quot; and it&apos;s
          right.
        </p>
      </Sec>

      <Sec title="Fix two: let every cell set its own bar">
        <p className="beta-note-p">
          The fan is real motion, so no camera setting touches it. The decision rule has to get smarter.
          Instead of one global threshold for the whole frame, every cell of the 32×18 grid keeps a
          running model of <em>its own</em> history: an exponential mean and variance of how much that
          spot normally changes.
        </p>
        <Code>{`# per grid cell, each tick:
resid   = delta − mean                       # how surprising is this?
fires   = delta > mean + K·σ   (K = 3.5)     # ...vs. this cell's OWN noise
mean    = (1−α)·mean + α·delta   (α = 0.15)  # then learn, slowly
var     = (1−α)·var  + α·resid²`}</Code>
        <p className="beta-note-p">
          This is the whole idea: a cell only counts as motion when it beats <strong>its own</strong>
          learned noise floor, not a global one. The fan&apos;s cells see big changes every tick, so
          their mean and variance climb until the fan no longer surprises them: the fan{" "}
          <strong>raises its own bar and self-mutes</strong>. The monitors do the same. A slow drift in
          room light gets absorbed into each cell&apos;s mean for free. And a person crossing a normally
          still patch of floor blows past that patch&apos;s tiny variance and fires immediately. Same
          math that gave the mics an adaptive noise floor, now per pixel.
        </p>
      </Sec>

      <Sec title="Fix two-and-a-half: require a real blob">
        <p className="beta-note-p">
          One more cheap filter. Even with the adaptive gate, a stray cell occasionally flickers through.
          A person isn&apos;t one hot cell. They&apos;re a contiguous, body-sized region. So we label the
          connected components of the fired cells and keep only the largest run (≥ 3 cells), and that
          becomes the box we hand to the vision model. Scattered single-cell blips (the last gasps of
          the fan) get dropped; the person-shaped blob wins. It also stops a sudden whole-frame light
          change from drawing one enormous box: if more than half the grid fires at once, that&apos;s not
          a person, that&apos;s the lights, and we ignore it.
        </p>
      </Sec>

      <Sec title="The payoff">
        <p className="beta-note-p">
          Tested first on a synthetic scene (a busy &quot;fan&quot; block plus a &quot;person&quot;
          crossing a quiet area), then live on the real rig. The fan stopped existing as far as the
          trigger was concerned, and the person came through clean.
        </p>
        <Code cap="before the gate learned, vs. after" receipt>{`synthetic, fan only      → 0 false fires once warmed (~1 min)
synthetic, person+fan    → one tight box on the PERSON, fan excluded
live, raw delta spike 14 → old code: FIRES (threshold was 7)
                           new code: gated motion 0, no box  ✓`}</Code>
        <p className="beta-note-p">
          That last line is the one I like. A global auto-exposure blip pushed the raw difference to 14,
          well over the old fixed threshold of 7, a guaranteed false alarm in the old world. The new
          pipeline looked at it cell by cell, saw nothing beat its own bar, and stayed quiet. The fan
          spins, the lights flicker, the screens scroll, and Meatball only speaks up when something that
          isn&apos;t supposed to move, moves.
        </p>
        <p className="beta-note-p" style={{ marginTop: 14 }}>
          The lesson generalizes past one appliance: when a sensor lies, don&apos;t amplify the lie. Stop
          it at the source, or teach the part that reads it to know what normal looks like. Usually both.
        </p>
      </Sec>

      {/* FOOT ========================================================= */}
      <section className="beta-note-sec" style={{ paddingTop: 18, paddingBottom: 28 }}>
        <div  style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link href="/meatball/notes/listening" className="btn"><BookOpen size={15} strokeWidth={2.4} /> The math of listening <span aria-hidden>→</span></Link>
          <Link href="/meatball" className="btn"><Eye size={15} strokeWidth={2.4} /> Watch it track motion <span aria-hidden>→</span></Link>
        </div>
      </section>
    </div>
  )
}
