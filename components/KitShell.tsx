import { Family } from "@/components/kit/Family"
import Link from "next/link"
import buildInfo from "@/lib/build-info.json"
import { DeployedAgo } from "@/components/kit/DeployedAgo"
import { KitNav } from "./KitNav"

/** The GitHub organisations /work and /contact already link. No others. */
const COLOPHON_ORGS = [
  { href: "https://github.com/isenbek", label: "isenbek" },
  { href: "https://github.com/tinymachines", label: "tinymachines" },
  { href: "https://github.com/Nominate-AI", label: "Nominate-AI" },
] as const

/**
 * The tinymachines style kit's chrome: masthead, page, colophon, fixed footer.
 *
 * This was app/beta/layout.tsx until the cutover. It stopped being a layout
 * because the pages it wraps no longer share a path prefix: they are at /, and
 * /about, and /papers, spread across the app root and interleaved with routes
 * that still run the v3 design. A layout cannot express "these eleven routes",
 * so SiteChrome picks per route and renders this.
 */
export function KitShell({ children }: { children: React.ReactNode }) {
  const shortHash = buildInfo.commitHash?.slice(0, 7) ?? ""

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

        {/* The colophon: where the site ends and says what it is. It flows with
            the page, above the fixed line below, because the fixed line has
            room for one fact (what is running) and this is five. A labelled
            section rather than a third <footer>: the fixed bar is the page's
            contentinfo, and two of those is a landmark list that lies.
            Every address here is one the site already links from /work or
            /contact; this is not the place a new one gets introduced. */}
        <section className="beta-nav-colophon" aria-label="Colophon">
          <div className="band">
            <p className="beta-nav-colophon__motto">
              <span>Anti-cloud.</span> <span>Host local, think global.</span>
            </p>
            <dl className="beta-nav-colophon__list">
              <div>
                <dt className="crumb">Email</dt>
                <dd>
                  <a href="mailto:brad@bradley.io">brad@bradley.io</a>
                </dd>
              </div>
              <div>
                <dt className="crumb">GitHub</dt>
                <dd>
                  {COLOPHON_ORGS.map((o) => (
                    <a key={o.label} href={o.href} target="_blank" rel="noopener noreferrer">
                      {o.label}
                    </a>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="crumb">Resume</dt>
                <dd>
                  <a href="/resume.pdf">resume.pdf</a>
                </dd>
              </div>
              <div>
                <dt className="crumb">Terminal</dt>
                <dd>
                  <Link href="/terminal" prefetch={false}>
                    /terminal
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* One line: the name, and what is running. The version is the visible
            "did this ship?" signal, so it keeps the shape it had on v3. */}
        <footer className="app-foot">
          <div className="band">
            <footer className="crumb site-foot">
              <Link href="/">bradley.io</Link>
              {/* The Meatball Labs family: the same strip on every family
                  site, this site's dot marked (owner's call, 2026-10-02). */}
              <Family me="steel" />
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
                {buildInfo.buildTime ? (
                  <>
                    {" · deployed "}
                    <DeployedAgo iso={buildInfo.buildTime} />
                  </>
                ) : null}
              </span>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  )
}
