import Link from "next/link"
import { ArrowLeft, BookOpen, Eye } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"

function Sec({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div className="v3-wrap">
        <V3Reveal>
          <div className="v3-sec-head" style={{ marginBottom: 18 }}>
            <div className="v3-sec-head__num">{n}</div>
            <h2 style={{ marginBottom: 0 }}>{title}</h2>
          </div>
        </V3Reveal>
        <V3Reveal>{children}</V3Reveal>
      </div>
    </section>
  )
}

function Code({ cap, receipt, children }: { cap?: string; receipt?: boolean; children: string }) {
  return (
    <div className={`v3-codeblock${receipt ? " v3-codeblock--receipt" : ""}`}>
      {cap ? <span className="v3-codeblock__cap">{cap}</span> : null}
      <code>{children}</code>
    </div>
  )
}

export default function ListeningPage() {
  return (
    <div className="v3-longform">
      {/* HEADER ======================================================== */}
      <header className="v3-page-head" style={{ paddingBottom: 16 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-40px", top: "-20px", width: 360, height: 360 }} />
        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/meatball" className="v3-air-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back to Meatball
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span className="v3-pill v3-pill--gold" style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
                <BookOpen size={14} strokeWidth={2.25} />
                field note · 02
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                The math of <span className="v3-accent">listening.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                How a pile of 16-bit numbers becomes &quot;someone is talking.&quot; A low-level walk from
                raw samples to the FFT to a working noise gate — every number here came from a live
                run on Meatball&apos;s actual microphones.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      <section className="v3-section" style={{ paddingTop: 4, paddingBottom: 8 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <Code cap="the pipeline">{`samples → DC-block → window → FFT → magnitude/dB → { profile · denoise · gate } → profit`}</Code>
          </V3Reveal>
        </div>
      </section>

      <Sec n="01" title="Samples — what sound is to a computer">
        <p className="v3-prose v3-longform__lead">
          A microphone&apos;s converter measures air pressure <code>R</code> times a second — Meatball
          records at 8 or 16 kHz. Each measurement is a 16-bit signed integer (<code>s16le</code>), a
          number between −32768 and +32767. The first thing we ever do is normalise it to a float
          in [−1, 1]: <code>x = int16 / 32768</code>.
        </p>
        <p className="v3-prose">
          Two facts decide everything downstream. <strong>Nyquist</strong>: a sample rate{" "}
          <code>R</code> can only represent frequencies up to <code>R/2</code> — at 8 kHz that&apos;s a
          4 kHz ceiling, fine since speech lives ~300–3400 Hz. And the <strong>DC-offset trap</strong>:
          a cheap converter adds a constant bias. We measured −531 counts on one dongle — a pure 0 Hz
          component reading as a healthy −35 dBFS &quot;signal,&quot; which fooled me for an hour into
          thinking a dead mic was alive. So we always subtract the mean (<code>x −= x.mean()</code>);
          the true floor underneath was −76 dBFS, 40 dB lower. <em>Subtract the mean, always.</em>
        </p>
      </Sec>

      <Sec n="02" title="From time to frequency — the DFT, and why the FFT">
        <p className="v3-prose">
          Fourier&apos;s idea: any signal is a sum of sine waves. The Discrete Fourier Transform asks
          &quot;how much of each frequency is in these N samples?&quot;
        </p>
        <Code cap="discrete fourier transform">{`X[k] = Σ  x[n] · e^(−2πi·kn/N)
       n = 0 … N−1`}</Code>
        <p className="v3-prose">
          Each <code>X[k]</code> is a complex number: its magnitude is how much of that frequency is
          present, its phase is where the wave sits in time. Bin <code>k</code> maps to frequency{" "}
          <code>f = k·R/N</code>, so frequency resolution is <code>R/N</code> — bigger N means finer
          bins but a longer frame (more latency). At N=1024, 8 kHz:
        </p>
        <Code>{`frequency resolution = R/N = 7.812 Hz per bin
frame length         = N/R = 128.0 ms`}</Code>
        <p className="v3-prose">
          The DFT as written is <code>O(N²)</code>. The <strong>FFT</strong> (Cooley–Tukey, 1965)
          computes the exact same numbers in <code>O(N log N)</code> by recursively splitting the sum
          into even and odd samples — for N=1024, about 100× fewer operations. That&apos;s the
          difference between real-time and not.
        </p>
      </Sec>

      <Sec n="03" title="Which FFT — the real one">
        <p className="v3-prose">
          Audio is real-valued. The DFT of a real signal is Hermitian-symmetric —{" "}
          <code>X[N−k] = conj(X[k])</code> — so the top half of the spectrum is a mirror image, pure
          redundancy. We use the <strong>real FFT</strong> (<code>numpy.fft.rfft</code>): it returns
          only the unique <code>N/2 + 1</code> bins (0 Hz to Nyquist), about 2× faster and half the
          memory. Every script in the rig uses it.
        </p>
        <Code>{`X     = np.fft.rfft(frame * window)   # 513 complex bins for N=1024
freqs = np.fft.rfftfreq(N, 1/R)       # the Hz value of each bin`}</Code>
      </Sec>

      <Sec n="04" title="The magic dust — windowing">
        <p className="v3-prose">
          The FFT secretly assumes your N samples repeat forever. A real chunk doesn&apos;t loop
          cleanly, so the jump at the wrap-around edge smears one tone&apos;s energy across many bins —{" "}
          <strong>spectral leakage</strong>. The fix: multiply the frame by a window that tapers to
          zero at both ends. We use the Hann window. Live proof, a 440 + 1200 Hz test signal:
        </p>
        <Code cap="leakage outside the two true peaks" receipt>{`no window:    6.07 %   energy smeared across the spectrum
Hann window:  0.03 %   ← 200× cleaner`}</Code>
        <p className="v3-prose">
          Cost: the main peak gets a hair wider. Worth it every time. (A footnote that teaches a lot:
          the 440 Hz tone landed in the 437.5 Hz bin — 440 isn&apos;t an exact multiple of 7.8125 Hz,
          so it sits between bins and spreads to its neighbours. Bins are discrete; the world
          isn&apos;t.)
        </p>
      </Sec>

      <Sec n="05" title="Reading the bins — magnitude, power, dBFS">
        <p className="v3-prose">
          Magnitude <code>|X[k]|</code> is the amplitude at that frequency; power is its square. We
          report in <strong>dBFS</strong> (decibels relative to full scale): <code>20·log10(amp)</code>,
          where 0 is the max and everything else is negative. The DC-blocked floor sits near −76 dBFS;
          speech towers ~40 dB above it. And <strong>RMS</strong> — the loudness of a frame — equals
          the total spectral energy (Parseval&apos;s theorem), so the gate can watch a cheap
          time-domain number and &quot;see&quot; exactly what the FFT shows.
        </p>
      </Sec>

      <Sec n="06" title="Special sauce — spectral subtraction">
        <p className="v3-prose">
          Sample the quiet room for ~15 s and average <code>|X[k]|</code> over every frame: that&apos;s a{" "}
          <strong>noise fingerprint</strong>. Boll&apos;s 1979 idea — every live frame is speech plus
          that same noise, so subtract the noise&apos;s magnitude and keep the original phase:
        </p>
        <Code>{`X   = rfft(frame · hann)          # complex spectrum
|S| = max(|X| − α·|N|,  β·|X|)    # subtract noise mag, floored
S   = |S| · e^(i·phase(X))        # reattach the original phase
y   = irfft(S);  overlap-add      # back to the time domain`}</Code>
        <p className="v3-prose">
          <code>α</code> is how hard you scrub; <code>β</code> is a spectral floor that stops{" "}
          <em>musical noise</em> (the warble of bins flickering on and off). Here&apos;s the part nobody
          tells you — run live on the hissy QuickCam, target &quot;the quick brown fox&quot;:
        </p>
        <Code cap="denoise α/β sweep vs. transcription" receipt>{`RAW                    floor −22 dBFS   "the quick brown BOX …"   ✗
α=1.0 β=0.15  gentle    floor −32 dBFS   "the quick brown FOX …"   ✓ fixed it
α=1.5 β=0.08           floor −39 dBFS   "the quick brown BOX …"   ✗
α=2.5 β=0.02  greedy    floor −55 dBFS   "(nothing)"               ✗ destroyed`}</Code>
        <p className="v3-prose">
          It&apos;s a <strong>U-curve</strong>. The objective was never minimum noise floor — crush it
          33 dB and you also crush the speech into artifacts the recogniser can&apos;t read. The sweet
          spot shaves ~10 dB, just enough to flip <code>box</code> → <code>fox</code>, and stops.
          The best-<em>sounding</em> result (lowest floor) was the worst transcript. Optimise the right
          metric.
        </p>
      </Sec>

      <Sec n="07" title="Profit — the voice gate">
        <p className="v3-prose">
          Now the box can decide on its own when someone&apos;s talking. All time-domain — measure each
          ~30 ms frame&apos;s RMS in dBFS, smooth it with a one-pole filter, and run a tiny state machine
          with two thresholds:
        </p>
        <Code>{`db  = 20·log10( rms(DC-blocked frame) )
ema = a·db + (1−a)·ema                 # smooth, a ≈ 0.4

OPEN   when ema > open_thresh          # a turn begins → record → transcribe
CLOSE  when ema < close_thresh for ~0.5 s   # hangover: pauses don't cut you off`}</Code>
        <p className="v3-prose">
          Two thresholds (<strong>hysteresis</strong>) so a level hovering at the edge doesn&apos;t
          chatter the gate; a <strong>hangover</strong> so a breath mid-sentence doesn&apos;t end your
          turn. Both come straight from the fingerprint: <code>open = floor + 12</code>,{" "}
          <code>close = floor + 6</code> dBFS. On Meatball&apos;s best ear that&apos;s open −28, close −34.
        </p>
        <p className="v3-prose" style={{ marginTop: 14 }}>
          And that&apos;s the whole arc: samples became a spectrum, the spectrum became a fingerprint,
          the fingerprint set the gate — and a junk-pile in a garage can hear you coming.
        </p>
      </Sec>

      {/* FOOT ========================================================= */}
      <section className="v3-section" style={{ paddingTop: 18, paddingBottom: 28 }}>
        <div className="v3-wrap" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link href="/lab/senses" className="v3-espace-cta"><BookOpen size={15} strokeWidth={2.4} /> The build story <span aria-hidden>→</span></Link>
          <Link href="/eyes" className="v3-espace-cta"><Eye size={15} strokeWidth={2.4} /> See through its eyes <span aria-hidden>→</span></Link>
        </div>
      </section>
    </div>
  )
}
