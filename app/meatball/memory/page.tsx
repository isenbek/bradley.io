import Link from "next/link"
import { MemoryTimeline } from "@/components/meatball/MemoryTimeline"

export default function Page() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <Link href="/meatball">Meatball</Link>
          </span>
          <span>
            {" / "}
            <span aria-current="page">Memory</span>
          </span>
        </nav>
        <h1>What it remembers</h1>
      </div>

      <p className="lede">
        Faces it has named, voices it has heard, and the moments it decided were worth keeping. The
        memory is a file on a salvaged drive, not a service.
      </p>

      <div className="v3 kit-island">
        <MemoryTimeline />
      </div>
    </div>
  )
}
