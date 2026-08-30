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

export default function ListeningPage() {
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
            <span aria-current="page">Field note 02</span>
          </span>
        </nav>
        <h1>The math of listening</h1>
      </div>

      <p className="lede">
          How a pile of 16-bit numbers becomes &quot;someone is talking.&quot; A low-level walk from
          raw samples to the FFT to a working noise gate. Every number here came from a live
          run on Meatball&apos;s actual microphones.
      </p>

      {/* HEADER ======================================================== */}

      <section className="beta-note-sec" style={{ paddingTop: 4, paddingBottom: 8 }}>
        <div >
          <Code cap="the pipeline">{`samples → DC-block → window → FFT → magnitude/dB → { profile · denoise · gate } → profit`}</Code>
        </div>
      </section>

      <Sec title="Samples: what sound is to a computer">
        <p className="lede">
          A microphone&apos;s converter measures air pressure <code>R</code> times a second. Meatball
          records at 8 or 16 kHz. Each measurement is a 16-bit signed integer (<code>s16le</code>), a
          number between −32768 and +32767. The first thing we ever do is normalise it to a float
          in [−1, 1]: <code>x = int16 / 32768</code>.
        </p>
        <p className="beta-note-p">
          Two facts decide everything downstream. <strong>Nyquist</strong>: a sample rate{" "}
          <code>R</code> can only represent frequencies up to <code>R/2</code>. At 8 kHz that&apos;s a
          4 kHz ceiling, fine since speech lives ~300 to 3400 Hz. And the <strong>DC-offset trap</strong>:
          a cheap converter adds a constant bias. We measured −531 counts on one dongle, a pure 0 Hz
          component reading as a healthy −35 dBFS &quot;signal,&quot; which fooled me for an hour into
          thinking a dead mic was alive. So we always subtract the mean (<code>x −= x.mean()</code>);
          the true floor underneath was −76 dBFS, 40 dB lower. <em>Subtract the mean, always.</em>
        </p>
      </Sec>

      <Sec title="From time to frequency: the DFT, and why the FFT">
        <p className="beta-note-p">
          Fourier&apos;s idea: any signal is a sum of sine waves. The Discrete Fourier Transform asks
          &quot;how much of each frequency is in these N samples?&quot;
        </p>
        <Code cap="discrete fourier transform">{`X[k] = Σ  x[n] · e^(−2πi·kn/N)
       n = 0 … N−1`}</Code>
        <p className="beta-note-p">
          Each <code>X[k]</code> is a complex number: its magnitude is how much of that frequency is
          present, its phase is where the wave sits in time. Bin <code>k</code> maps to frequency{" "}
          <code>f = k·R/N</code>, so frequency resolution is <code>R/N</code>: bigger N means finer
          bins but a longer frame (more latency). At N=1024, 8 kHz:
        </p>
        <Code>{`frequency resolution = R/N = 7.812 Hz per bin
frame length         = N/R = 128.0 ms`}</Code>
        <p className="beta-note-p">
          The DFT as written is <code>O(N²)</code>. The <strong>FFT</strong> (Cooley–Tukey, 1965)
          computes the exact same numbers in <code>O(N log N)</code> by recursively splitting the sum
          into even and odd samples, for N=1024 about 100× fewer operations. That&apos;s the
          difference between real-time and not.
        </p>
      </Sec>

      <Sec title="Which FFT: the real one">
        <p className="beta-note-p">
          Audio is real-valued. The DFT of a real signal is Hermitian-symmetric (
          <code>X[N−k] = conj(X[k])</code>), so the top half of the spectrum is a mirror image, pure
          redundancy. We use the <strong>real FFT</strong> (<code>numpy.fft.rfft</code>): it returns
          only the unique <code>N/2 + 1</code> bins (0 Hz to Nyquist), about 2× faster and half the
          memory. Every script in the rig uses it.
        </p>
        <Code>{`X     = np.fft.rfft(frame * window)   # 513 complex bins for N=1024
freqs = np.fft.rfftfreq(N, 1/R)       # the Hz value of each bin`}</Code>
      </Sec>

      <Sec title="The magic dust: windowing">
        <p className="beta-note-p">
          The FFT secretly assumes your N samples repeat forever. A real chunk doesn&apos;t loop
          cleanly, so the jump at the wrap-around edge smears one tone&apos;s energy across many bins:{" "}
          <strong>spectral leakage</strong>. The fix: multiply the frame by a window that tapers to
          zero at both ends. We use the Hann window. Live proof, a 440 + 1200 Hz test signal:
        </p>
        <Code cap="leakage outside the two true peaks" receipt>{`no window:    6.07 %   energy smeared across the spectrum
Hann window:  0.03 %   ← 200× cleaner`}</Code>
        <p className="beta-note-p">
          Cost: the main peak gets a hair wider. Worth it every time. (A footnote that teaches a lot:
          the 440 Hz tone landed in the 437.5 Hz bin: 440 isn&apos;t an exact multiple of 7.8125 Hz,
          so it sits between bins and spreads to its neighbours. Bins are discrete; the world
          isn&apos;t.)
        </p>
      </Sec>

      <Sec title="Reading the bins: magnitude, power, dBFS">
        <p className="beta-note-p">
          Magnitude <code>|X[k]|</code> is the amplitude at that frequency; power is its square. We
          report in <strong>dBFS</strong> (decibels relative to full scale): <code>20·log10(amp)</code>,
          where 0 is the max and everything else is negative. The DC-blocked floor sits near −76 dBFS;
          speech towers ~40 dB above it. And <strong>RMS</strong> (the loudness of a frame) equals
          the total spectral energy (Parseval&apos;s theorem), so the gate can watch a cheap
          time-domain number and &quot;see&quot; exactly what the FFT shows.
        </p>
      </Sec>

      <Sec title="Special sauce: spectral subtraction">
        <p className="beta-note-p">
          Sample the quiet room for ~15 s and average <code>|X[k]|</code> over every frame: that&apos;s a{" "}
          <strong>noise fingerprint</strong>. Boll&apos;s 1979 idea: every live frame is speech plus
          that same noise, so subtract the noise&apos;s magnitude and keep the original phase:
        </p>
        <Code>{`X   = rfft(frame · hann)          # complex spectrum
|S| = max(|X| − α·|N|,  β·|X|)    # subtract noise mag, floored
S   = |S| · e^(i·phase(X))        # reattach the original phase
y   = irfft(S);  overlap-add      # back to the time domain`}</Code>
        <p className="beta-note-p">
          <code>α</code> is how hard you scrub; <code>β</code> is a spectral floor that stops{" "}
          <em>musical noise</em> (the warble of bins flickering on and off). Here&apos;s the part nobody
          tells you: run live on the hissy QuickCam, target &quot;the quick brown fox&quot;:
        </p>
        <Code cap="denoise α/β sweep vs. transcription" receipt>{`RAW                    floor −22 dBFS   "the quick brown BOX …"   ✗
α=1.0 β=0.15  gentle    floor −32 dBFS   "the quick brown FOX …"   ✓ fixed it
α=1.5 β=0.08           floor −39 dBFS   "the quick brown BOX …"   ✗
α=2.5 β=0.02  greedy    floor −55 dBFS   "(nothing)"               ✗ destroyed`}</Code>
        <p className="beta-note-p">
          It&apos;s a <strong>U-curve</strong>. The objective was never minimum noise floor: crush it
          33 dB and you also crush the speech into artifacts the recogniser can&apos;t read. The sweet
          spot shaves ~10 dB, just enough to flip <code>box</code> → <code>fox</code>, and stops.
          The best-<em>sounding</em> result (lowest floor) was the worst transcript. Optimise the right
          metric.
        </p>
      </Sec>

      <Sec title="Profit: the voice gate">
        <p className="beta-note-p">
          Now the box can decide on its own when someone&apos;s talking. All time-domain: measure each
          ~30 ms frame&apos;s RMS in dBFS, smooth it with a one-pole filter, and run a tiny state machine
          with two thresholds:
        </p>
        <Code>{`db  = 20·log10( rms(DC-blocked frame) )
ema = a·db + (1−a)·ema                 # smooth, a ≈ 0.4

OPEN   when ema > open_thresh          # a turn begins → record → transcribe
CLOSE  when ema < close_thresh for ~0.5 s   # hangover: pauses don't cut you off`}</Code>
        <p className="beta-note-p">
          Two thresholds (<strong>hysteresis</strong>) so a level hovering at the edge doesn&apos;t
          chatter the gate; a <strong>hangover</strong> so a breath mid-sentence doesn&apos;t end your
          turn. Both come straight from the fingerprint: <code>open = floor + 12</code>,{" "}
          <code>close = floor + 6</code> dBFS. On Meatball&apos;s best ear that&apos;s open −28, close −34.
        </p>
        <p className="beta-note-p" style={{ marginTop: 14 }}>
          And that&apos;s the whole arc: samples became a spectrum, the spectrum became a fingerprint,
          the fingerprint set the gate, and a junk-pile in a garage can hear you coming.
        </p>
      </Sec>

      {/* FOOT ========================================================= */}
      <section className="beta-note-sec" style={{ paddingTop: 18, paddingBottom: 28 }}>
        <div  style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link href="/meatball/notes/senses" className="btn"><BookOpen size={15} strokeWidth={2.4} /> The build story <span aria-hidden>→</span></Link>
          <Link href="/eyes" className="btn"><Eye size={15} strokeWidth={2.4} /> See through its eyes <span aria-hidden>→</span></Link>
        </div>
      </section>
    </div>
  )
}
