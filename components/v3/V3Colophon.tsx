import Link from "next/link"
import { Github, SlidersHorizontal } from "lucide-react"

const ORGS = [
  { href: "https://github.com/isenbek", label: "isenbek" },
  { href: "https://github.com/tinymachines", label: "tinymachines" },
  { href: "https://github.com/Nominate-AI", label: "Nominate-AI" },
]

/**
 * Above-footer colophon. The GitHub org pills and the device-capability link
 * used to live in the fixed 48px footer bar, which overflowed and wrapped once
 * the bar also had to carry the brand, version and deploy time. They belong in
 * flowing content, not in the always-on status strip — the bar is now just the
 * "did it ship?" cue.
 */
export function V3Colophon() {
  return (
    <section className="v3-colophon">
      <div className="v3-wrap">
        <div className="v3-colophon__in">
          <span className="v3-colophon__lbl">Source lives here</span>
          <nav className="v3-colophon__orgs" aria-label="GitHub organisations">
            {ORGS.map((o) => (
              <a
                key={o.label}
                href={o.href}
                target="_blank"
                rel="noopener noreferrer"
                className="v3-colophon__org"
              >
                <Github size={13} strokeWidth={2.25} />
                {o.label}
              </a>
            ))}
            <Link href="/preferences" className="v3-colophon__org">
              <SlidersHorizontal size={13} strokeWidth={2.25} />
              device scanner
            </Link>
          </nav>
        </div>
      </div>
    </section>
  )
}
