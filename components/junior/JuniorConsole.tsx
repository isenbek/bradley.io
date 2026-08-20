"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, HardDrive, ShieldCheck, TerminalSquare, Radio, Copy, Check, LogOut, Maximize2, Minimize2 } from "lucide-react"
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
  const [isFull, setIsFull] = useState(false)

  // Track fullscreen from the document, not from our own click — Esc and the
  // browser's own chrome can exit it without ever calling toggleFull().
  useEffect(() => {
    const sync = () => setIsFull(document.fullscreenElement === termRef.current)
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
            <span className="v3-cardhead__meta">if the Pi or its card dies</span>
          </div>
          <ul className="v3-jr-docs">
            <li className="v3-jr-doc">
              <a className="v3-jr-doc__main" href="/api/junior/recovery/rpi5-router-recovery-20260820.img.gz">
                <span className="v3-jr-doc__title">Recovery image — flash and go</span>
                <span className="v3-jr-doc__sum">
                  Full OpenWrt image with the live config baked in. Write it to a card,
                  plug it in, and the new Pi <em>is</em> the router — no setup.
                </span>
                <span className="v3-jr-doc__meta">15 MB · .img.gz · built 2026-08-20 — AT&amp;T + mwan3 failover + IPv6 off</span>
              </a>
            </li>
            <li className="v3-jr-doc">
              <a className="v3-jr-doc__main" href="/api/junior/recovery/junior-config-20260820-1534.tar.gz">
                <span className="v3-jr-doc__title">Config backup</span>
                <span className="v3-jr-doc__sum">
                  Restore onto a working Pi via LuCI &rarr; System &rarr; Backup / Flash Firmware.
                </span>
                <span className="v3-jr-doc__meta">19 KB · .tar.gz · taken 2026-08-20 15:34</span>
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
          {/* Step 1 — download */}
          <article className="v3-jr-step">
            <div className="v3-jr-step__n" aria-hidden>
              1
            </div>
            <div className="v3-jr-step__body">
              <div className="v3-cardhead">
                <Download size={17} strokeWidth={2.4} aria-hidden />
                <h2>Download the image</h2>
              </div>
              <p>
                OpenWrt 24.10.1 for the Raspberry Pi 5, built on this host. This is the{" "}
                <strong>squashfs factory</strong> build — the one you write to a blank card.
              </p>

              <a className="v3-btn v3-btn--primary v3-jr-dl" href="/api/junior/image" download>
                <Download size={16} strokeWidth={2.5} aria-hidden />
                Download image
                <span className="v3-jr-dl__meta">12 MB · .img.gz</span>
              </a>

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

              <p className="v3-jr-note">
                Check it before you flash — a half-downloaded image bricks the boot and looks
                exactly like a hardware fault, which is a miserable thing to debug remotely.
              </p>
              <Cmd>{`sha256sum ${IMAGE_NAME}`}</Cmd>
            </div>
          </article>

          {/* Step 2 — flash */}
          <article className="v3-jr-step">
            <div className="v3-jr-step__n" aria-hidden>
              2
            </div>
            <div className="v3-jr-step__body">
              <div className="v3-cardhead">
                <HardDrive size={17} strokeWidth={2.4} aria-hidden />
                <h2>Write it to the card</h2>
              </div>
              <p>
                Easiest path: <strong>Raspberry Pi Imager</strong> → &ldquo;Use custom&rdquo; → pick
                the <code>.img.gz</code> (it decompresses for you) → select the card → write.
              </p>
              <p className="v3-jr-note">
                If you&rsquo;d rather do it from a terminal, confirm the device name first with{" "}
                <code>lsblk</code>. Getting this wrong overwrites the wrong disk, so read it twice —
                it&rsquo;s <code>/dev/sdX</code>, the whole disk, not <code>/dev/sdX1</code>.
              </p>
              <Cmd>{`lsblk -o NAME,SIZE,TYPE,MOUNTPOINT`}</Cmd>
              <Cmd>{`gunzip -c ${IMAGE_NAME} | sudo dd of=/dev/sdX bs=4M conv=fsync status=progress`}</Cmd>
              <p className="v3-jr-note">
                Then put the card in the Pi, plug it into your router with an ethernet cable, and
                power it on.
              </p>
            </div>
          </article>

          {/* Step 3 — phone home */}
          <article className="v3-jr-step">
            <div className="v3-jr-step__n" aria-hidden>
              3
            </div>
            <div className="v3-jr-step__body">
              <div className="v3-cardhead">
                <Radio size={17} strokeWidth={2.4} aria-hidden />
                <h2>It calls home</h2>
              </div>
              <p>
                The image already carries its WireGuard key and my endpoint. On boot it brings the
                tunnel up by itself — nothing to configure on your side, and no ports to open on
                your router, because the Pi makes the outbound connection.
              </p>
              <p className="v3-jr-note">
                Give it about a minute after the power light settles. When the handshake lands it
                shows up on my side and I can start working in the terminal below.
              </p>
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
              className="v3-jr-term__frame"
              src="/junior/pty/"
              title="Shared terminal session"
              allow="fullscreen"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
