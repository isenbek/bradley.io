"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { HardDrive, ShieldCheck, TerminalSquare, Radio, Copy, Check, LogOut, Maximize2, Minimize2 } from "lucide-react"
import { JuniorDocs } from "./JuniorDocs"

// TEMPORARY — the authed half of /junior. Delete at teardown.

const IMAGE_NAME = "openwrt-24.10.1-bcm27xx-bcm2712-rpi-5-squashfs-factory.img.gz"
const IMAGE_SHA = "c50e1768c48d82e1d49400bdc49828cd53e9afad5f9392569c9f9b450e51a056"

function Copyable({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="v3-jr-copy"
      aria-label={label ? `Copy ${label}` : "Copy"}
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1400)
      }}
    >
      {done ? <Check size={13} strokeWidth={2.8} /> : <Copy size={13} strokeWidth={2.4} />}
      {done ? "copied" : "copy"}
    </button>
  )
}

function Cmd({ children }: { children: string }) {
  return (
    <div className="v3-jr-cmd">
      <pre>{children}</pre>
      <Copyable text={children} label="command" />
    </div>
  )
}

export function JuniorConsole() {
  const router = useRouter()
  const termRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [isFull, setIsFull] = useState(false)

  // Track fullscreen from the document, not from our own click — Esc and the
  // browser's own chrome can exit it without ever calling toggleFull().
  //
  // Going fullscreen grows the iframe, but the terminal inside does not
  // re-measure on its own, so it keeps drawing at the old column count and the
  // new space renders as empty cells.
  //
  // Do NOT reload the iframe to fix this. Replacing content inside the
  // fullscreen element makes the browser drop straight back out — that broke
  // the button entirely once already.
  //
  // A synthetic resize event was not enough either. What works is forcing a
  // REAL layout change: size the frame explicitly, then nudge it by a pixel so
  // the terminal's own resize observer fires. Repeated a few times because the
  // fullscreen transition is animated and the final size is not known at once.
  useEffect(() => {
    const refit = () => {
      const f = frameRef.current
      if (!f) return
      const full = document.fullscreenElement === termRef.current
      if (full) {
        f.style.height = "calc(100vh - 42px)"
        f.style.maxHeight = "none"
      } else {
        f.style.height = ""
        f.style.maxHeight = ""
      }
      // a genuine one-pixel change; layout must actually move
      const h = f.getBoundingClientRect().height
      f.style.height = `${Math.max(200, Math.round(h) - 1)}px`
      window.requestAnimationFrame(() => {
        f.style.height = full ? "calc(100vh - 42px)" : ""
        try {
          f.contentWindow?.dispatchEvent(new Event("resize"))
        } catch {
          /* frame not ready; later attempts cover it */
        }
      })
    }

    const sync = () => {
      setIsFull(document.fullscreenElement === termRef.current)
      for (const delay of [80, 300, 650, 1200]) window.setTimeout(refit, delay)
    }
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen()
    else termRef.current?.requestFullscreen?.()
  }

  async function lock() {
    await fetch("/api/junior/auth", { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="v3-longform v3-jr">
      <header className="v3-page-head" style={{ paddingBottom: 8 }}>
        <div className="v3-wrap">
          <div className="v3-jr-topline">
            <span className="v3-pill v3-pill--coral v3-jr-pill">temporary · unlisted · gets torn down</span>
            <button type="button" className="v3-jr-lock" onClick={lock}>
              <LogOut size={13} strokeWidth={2.4} aria-hidden /> lock
            </button>
          </div>

          <h1>
            Hey <span className="v3-accent">Junior.</span>
          </h1>

          <p className="v3-page-head__lede">
            Three things happen on this page. You flash the image below onto the Pi 5. It boots and
            dials a WireGuard tunnel back to my machine. Then I work on it from the terminal at the
            bottom — and you watch every keystroke, live, so you can see what each command actually
            does rather than just getting a working box back.
          </p>
        </div>
      </header>

      {/* Documents first — this used to sit below the walkthrough, ~60% down
          the page, and went unnoticed. The thing someone comes back for
          belongs at the top. */}
      <JuniorDocs />

      {/* Recovery kit — the "if the Pi dies" box. Gated by the same PIN, and
          these files contain real secrets; never link them publicly. */}
      <section className="v3-section v3-jr-docsec" style={{ paddingTop: 0 }}>
        <div className="v3-wrap">
          <div className="v3-cardhead">
            <ShieldCheck size={17} strokeWidth={2.4} aria-hidden />
            <h2>Recovery kit</h2>
            <span className="v3-cardhead__meta">current &middot; built 20 Aug 2026</span>
          </div>
          <p className="v3-jr-note" style={{ marginTop: 0 }}>
            <strong>Which one do I need?</strong> The <em>image</em> is the whole computer &mdash;
            OpenWrt, every package, and your settings. The <em>config</em> is only your settings.
            <br />
            Hardware died &rarr; <strong>image</strong>. Changed something and regret it &rarr;{" "}
            <strong>config</strong>.
            <br />
            The config alone <strong>cannot</strong> rebuild a dead Pi &mdash; restored onto stock
            OpenWrt it would reference mwan3, banIP, adblock and NextDNS, none of which would be
            installed.
          </p>
          <ul className="v3-jr-docs">
            <li className="v3-jr-doc">
              <a className="v3-jr-doc__main" href="/api/junior/recovery/rpi5-router-recovery-20260821.img.gz">
                <span className="v3-jr-doc__title">Recovery image &mdash; flash and go &nbsp;<strong>&larr; if the Pi died</strong></span>
                <span className="v3-jr-doc__sum">
                  Full OpenWrt image with the live config baked in. Write it to a card,
                  plug it in, and the new Pi <em>is</em> the router — no setup.
                </span>
                <span className="v3-jr-doc__meta">15 MB · .img.gz · rebuilt 2026-08-21 — failover, filtering, LuCI WAN buttons, email alerts, watchdog, ISP report</span>
              </a>
            </li>
            <li className="v3-jr-doc">
              <a className="v3-jr-doc__main" href="/api/junior/recovery/junior-config-20260821-2325.tar.gz">
                <span className="v3-jr-doc__title">Config backup &nbsp;<strong>&larr; if you broke a setting</strong></span>
                <span className="v3-jr-doc__sum">
                  Restore onto a working Pi via LuCI &rarr; System &rarr; Backup / Flash Firmware.
                </span>
                <span className="v3-jr-doc__meta">28 KB · .tar.gz · taken 2026-08-21 23:25</span>
              </a>
            </li>
            <li className="v3-jr-doc">
              <a className="v3-jr-doc__main" href="/api/junior/recovery/sha256sums">
                <span className="v3-jr-doc__title">Checksums</span>
                <span className="v3-jr-doc__sum">Verify a download before trusting it.</span>
                <span className="v3-jr-doc__meta">sha256sums</span>
              </a>
            </li>
          </ul>
          <p className="v3-jr-note">
            <strong>These contain secrets</strong> — the WireGuard key, the root password
            hash, ssh host keys. Keep them as private as a password.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="v3-section" style={{ paddingTop: 10 }}>
        <div className="v3-wrap v3-jr-steps">
          {/* Writing a card — only relevant for the RECOVERY image */}
          <article className="v3-jr-step">
            <div className="v3-jr-step__n" aria-hidden>
              1
            </div>
            <div className="v3-jr-step__body">
              <div className="v3-cardhead">
                <HardDrive size={17} strokeWidth={2.4} aria-hidden />
                <h2>Writing the recovery card</h2>
                <span className="v3-cardhead__meta">only if the Pi or its card died</span>
              </div>
              <p>
                Use the <strong>recovery image</strong> from the kit above &mdash; the one with
                today&rsquo;s date in the filename. It already contains your whole router.
              </p>
              <p className="v3-jr-note">
                Verify the download first. A truncated image fails to boot and looks exactly like a
                hardware fault, which is a miserable thing to debug when the network is already down.
              </p>
              <Cmd>{`sha256sum rpi5-router-recovery-20260820.img.gz`}</Cmd>
              <p>
                Easiest path: <strong>Raspberry Pi Imager</strong> &rarr; &ldquo;Use custom&rdquo;
                &rarr; pick the <code>.img.gz</code> (it decompresses for you) &rarr; select the card
                &rarr; write.
              </p>
              <p className="v3-jr-note">
                From a terminal instead, confirm the device name first with <code>lsblk</code>.
                Getting this wrong overwrites the wrong disk, so read it twice &mdash; it&rsquo;s{" "}
                <code>/dev/sdX</code>, the whole disk, not <code>/dev/sdX1</code>.
              </p>
              <Cmd>{`lsblk -o NAME,SIZE,TYPE,MOUNTPOINT`}</Cmd>
              <Cmd>{`gunzip -c rpi5-router-recovery-20260820.img.gz | sudo dd of=/dev/sdX bs=4M conv=fsync status=progress`}</Cmd>
              <p className="v3-jr-note">
                Card into the Pi, ethernet into <strong>the same USB adapter the ISP was in</strong>,
                power on. It comes up as <code>10.0.0.1</code> already being the router.
              </p>
            </div>
          </article>

          {/* Historical — the original blank build */}
          <article className="v3-jr-step">
            <div className="v3-jr-step__n" aria-hidden>
              &mdash;
            </div>
            <div className="v3-jr-step__body">
              <div className="v3-cardhead">
                <Radio size={17} strokeWidth={2.4} aria-hidden />
                <h2>The original build image</h2>
                <span className="v3-cardhead__meta">historical &middot; not what you want</span>
              </div>
              <p className="v3-jr-note">
                <strong>Do not flash this.</strong> It is the blank OpenWrt build from the first day
                &mdash; no mwan3, no filtering, no AT&amp;T, none of your settings. Writing it would
                replace a working router with an empty one.
              </p>
              <p className="v3-jr-note">
                Kept only so the original starting point is recoverable. If you need a fresh router
                from scratch, use the <strong>recovery image</strong> above instead &mdash; it is the
                same OpenWrt, with everything already configured.
              </p>
              <details className="v3-jr-note">
                <summary>Original image details</summary>
                <dl className="v3-jr-facts">
                  <div>
                    <dt>Filename</dt>
                    <dd>
                      <code>{IMAGE_NAME}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <ShieldCheck size={13} strokeWidth={2.4} aria-hidden /> SHA-256
                    </dt>
                    <dd className="v3-jr-facts__hash">
                      <code>{IMAGE_SHA}</code>
                      <Copyable text={IMAGE_SHA} label="hash" />
                    </dd>
                  </div>
                </dl>
                <a className="v3-jr-doc__meta" href="/api/junior/image" download>
                  download the original blank image
                </a>
              </details>
            </div>
          </article>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="v3-section v3-jr-termsec">
        <div className="v3-wrap">
          <div className="v3-cardhead">
            <TerminalSquare size={17} strokeWidth={2.4} aria-hidden />
            <h2>Live terminal</h2>
            <span className="v3-cardhead__meta">shared session · you see what I type</span>
          </div>
          <p className="v3-jr-note" style={{ marginTop: 0 }}>
            This is one shared shell — the same session on both our screens. Ask questions as I go;
            that&rsquo;s the point of doing it this way.
          </p>

          <div className="v3-jr-term" ref={termRef}>
            <div className="v3-jr-term__bar">
              <span className="v3-jr-term__dot v3-jr-term__dot--r" aria-hidden />
              <span className="v3-jr-term__dot v3-jr-term__dot--y" aria-hidden />
              <span className="v3-jr-term__dot v3-jr-term__dot--g" aria-hidden />
              <span className="v3-jr-term__title">tmux · junior</span>
              <button
                type="button"
                className="v3-jr-term__full"
                onClick={toggleFull}
                aria-label={isFull ? "Exit full screen" : "Full screen"}
              >
                {isFull ? <Minimize2 size={13} strokeWidth={2.4} aria-hidden /> : <Maximize2 size={13} strokeWidth={2.4} aria-hidden />}
                <span>{isFull ? "Exit" : "Full screen"}</span>
              </button>
            </div>
            <iframe
              ref={frameRef}
              className="v3-jr-term__frame"
              src="/junior/pty/"
              title="Shared terminal session"
              allow="fullscreen; clipboard-read; clipboard-write"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
