import { BioLogo } from "./BioLogo"

export function V3Footer() {
  return (
    <footer className="v3-footer">
      <div className="v3-wrap">
        <div className="v3-footer__mark">
          <BioLogo height={56} title="bio" style={{ color: "var(--v3-blue-400)" }} />
          <span className="v3-footer__sub">
            <span className="v3-footer__dot">·</span>bradley.io
          </span>
        </div>
        <p>Hardware hacker · data architect · AI pilot. Built in Grand Rapids, MI.</p>
        <p className="v3-footer__meta">
          Bio Blue #13B8F3 primary · Anti-Cloud, host local, think global.
        </p>
      </div>
    </footer>
  )
}
