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

      {/* The terminal keeps its own look deliberately: a CLI that took the
          surrounding page's typography would stop reading as a terminal, which
          is the one thing this component is for. See .kit-island in app/kit.css. */}
      <div className="v3 kit-island">
        <V3Terminal />
      </div>
    </div>
  )
}
