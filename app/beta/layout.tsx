import type { Metadata } from "next"
import Link from "next/link"
import buildInfo from "@/lib/build-info.json"
import { timeAgo } from "@/lib/time-ago"
import { BetaNav } from "./BetaNav"
import "./beta.css"

/**
 * The beta shell: the tinymachines style kit's chrome, on bradley.io's content.
 *
 * There is no `.v3` wrapper anywhere in here, and that is the point of the whole
 * arrangement. components/SiteChrome.tsx sees a /beta path and renders children
 * bare, so this layout is the first thing under <body> and owns the ground.
 */

export const metadata: Metadata = {
  // Beta is a work in progress at a public URL. Keeping it out of the index is
  // the difference between showing someone a draft and publishing one, and it
  // also stops it competing with the live pages it is a copy of.
  robots: { index: false, follow: false },
}

export default function BetaLayout({ children }: { children: React.ReactNode }) {
  const shortHash = buildInfo.commitHash?.slice(0, 7) ?? ""
  const deployedAgo = buildInfo.buildTime ? timeAgo(buildInfo.buildTime) : ""

  return (
    <div className="beta-root">
      <a className="beta-skip" href="#beta-main">
        Skip to content
      </a>

      <div className="app-shell">
        <BetaNav />

        <main className="app-main" id="beta-main">
          {children}
        </main>

        {/* One line: the name, and what is running. The version is the visible
            "did this ship?" signal, so it keeps the same shape it has on v3. */}
        <footer className="app-foot">
          <div className="band">
            <footer className="crumb site-foot">
              <Link href="/beta">bradley.io</Link>
              <span>
                {" / "}
                <a
                  href={`https://github.com/isenbek/bradley.io/commit/${buildInfo.commitHashFull}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`commit ${shortHash} · ${buildInfo.commitDate}`}
                >
                  {buildInfo.version}
                </a>
                {deployedAgo ? ` · deployed ${deployedAgo}` : ""}
              </span>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  )
}
