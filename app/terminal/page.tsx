import Link from "next/link"
import { V3Terminal } from "./V3Terminal"

export default function TerminalPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Terminal</span>
          </span>
        </nav>
        <h1>The site, as a shell</h1>
      </div>

      <p className="lede">
        Everything on this site, reachable by typing. Start with <code>help</code>.
      </p>

      {/* PERMANENT ISLAND, decided 2026-08-30.
          Every other instrument was ported off v3; this one is not going to be.
          A terminal that adopts the page's serif prose and paper ground stops
          reading as a terminal, and reading as a terminal is the entire job of
          this component. The seam here is the design, not unfinished work.
          See .kit-island in app/kit.css. */}
      <div className="v3 kit-island">
        <V3Terminal />
      </div>
    </div>
  )
}
