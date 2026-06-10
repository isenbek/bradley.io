import Link from "next/link"
import { Github } from "lucide-react"
import buildInfo from "@/lib/build-info.json"
import { timeAgo } from "@/lib/time-ago"
import { BioLogo } from "./BioLogo"

/**
 * Compact fixed-bottom footer. Always visible during scroll so the build
 * version and deploy time are within glance — the user's "did it ship?" cue.
 * The rich tagline footer was removed when the layout went fixed; if you
 * need a long-form footer back, build it as a separate above-footer section.
 */
export function V3Footer() {
  const shortHash = buildInfo.commitHash?.slice(0, 7) ?? ""
  const deployedAgo = buildInfo.buildTime ? timeAgo(buildInfo.buildTime) : ""

  return (
    <footer className="v3-footer">
      <div className="v3-footer__bar">
        {/* Left: bio mark + tagline + GR badge */}
        <Link href="/" className="v3-footer__brand" aria-label="bio·bradley.io home">
          <BioLogo
            height={22}
            title=""
            bodyColor="var(--v3-blue-400)"
            dotColor="var(--v3-blue-200)"
          />
          <span className="v3-footer__brand-text">
            bradley<span style={{ color: "var(--v3-blue-300)" }}>.io</span>
          </span>
          <span className="v3-footer__loc">· Grand Rapids, MI</span>
        </Link>

        {/* Right: GitHub repos + version + deploy */}
        <div className="v3-footer__build">
          <a
            href="https://github.com/isenbek"
            target="_blank"
            rel="noopener noreferrer"
            className="v3-footer__gh"
            title="GitHub · @isenbek"
          >
            <Github size={13} strokeWidth={2.25} /> isenbek
          </a>
          <a
            href="https://github.com/tinymachines"
            target="_blank"
            rel="noopener noreferrer"
            className="v3-footer__gh"
            title="GitHub · @tinymachines"
          >
            <Github size={13} strokeWidth={2.25} /> tinymachines
          </a>
          <a
            href="https://github.com/Nominate-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="v3-footer__gh"
            title="GitHub · Nominate-AI"
          >
            <Github size={13} strokeWidth={2.25} /> Nominate-AI
          </a>
          <a
            href={`https://github.com/isenbek/bradley.io/commit/${buildInfo.commitHashFull}`}
            target="_blank"
            rel="noopener noreferrer"
            className="v3-footer__version"
            title={`commit ${shortHash} · ${buildInfo.commitDate}`}
          >
            <span className="v3-footer__pill">{buildInfo.version}</span>
            <span className="v3-footer__hash">@{shortHash}</span>
          </a>
          <span className="v3-footer__deployed">
            <strong>{deployedAgo}</strong>
          </span>
        </div>
      </div>
    </footer>
  )
}
