import Link from "next/link"
import buildInfo from "@/lib/build-info.json"
import { timeAgo } from "@/lib/time-ago"
import { KitNav } from "./KitNav"

/**
 * The tinymachines style kit's chrome: masthead, page, fixed footer.
 *
 * This was app/beta/layout.tsx until the cutover. It stopped being a layout
 * because the pages it wraps no longer share a path prefix: they are at /, and
 * /about, and /papers, spread across the app root and interleaved with routes
 * that still run the v3 design. A layout cannot express "these eleven routes",
 * so SiteChrome picks per route and renders this.
 */
export function KitShell({ children }: { children: React.ReactNode }) {
  const shortHash = buildInfo.commitHash?.slice(0, 7) ?? ""
  const deployedAgo = buildInfo.buildTime ? timeAgo(buildInfo.buildTime) : ""

  return (
    <div className="beta-root">
      <a className="beta-skip" href="#kit-main">
        Skip to content
      </a>

      <div className="app-shell">
        <KitNav />

        <main className="app-main" id="kit-main">
          {children}
        </main>

        {/* One line: the name, and what is running. The version is the visible
            "did this ship?" signal, so it keeps the shape it had on v3. */}
        <footer className="app-foot">
          <div className="band">
            <footer className="crumb site-foot">
              <Link href="/">bradley.io</Link>
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
