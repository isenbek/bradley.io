import buildInfo from "@/lib/build-info.json"
import { timeAgo } from "@/lib/time-ago"
import { BioLogo } from "./BioLogo"

export function V3Footer() {
  const shortHash = buildInfo.commitHash?.slice(0, 7) ?? ""
  const deployedAgo = buildInfo.buildTime ? timeAgo(buildInfo.buildTime) : ""

  return (
    <footer className="v3-footer">
      <div className="v3-wrap">
        <div className="v3-footer__mark">
          <BioLogo
            height={56}
            title="bio"
            bodyColor="var(--v3-blue-400)"
            dotColor="var(--v3-blue-200)"
          />
          <span className="v3-footer__sub">
            <span className="v3-footer__dot">·</span>bradley.io
          </span>
        </div>
        <p>Hardware hacker · data architect · AI pilot. Built in Grand Rapids, MI.</p>
        <p className="v3-footer__meta">
          Bio Blue #13B8F3 primary · Anti-Cloud, host local, think global.
        </p>

        <div className="v3-footer__build">
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
            deployed <strong>{deployedAgo}</strong>
          </span>
        </div>
      </div>
    </footer>
  )
}
