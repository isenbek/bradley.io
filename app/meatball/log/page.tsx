import Link from "next/link"
import { EventLog } from "@/components/meatball/EventLog"

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
            <span aria-current="page">Event log</span>
          </span>
        </nav>
        <h1>What it noticed</h1>
      </div>

      <p className="lede">
        Every motion event, transcription and greeting the machine logged, newest first. Written as it happened, not summarised after.
      </p>

        <EventLog />
    </div>
  )
}
