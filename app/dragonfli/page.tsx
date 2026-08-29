import Link from "next/link"
import { DragonfliBoard } from "@/components/dragonfli/DragonfliBoard"

export default function DragonfliPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Dragonfli</span>
          </span>
        </nav>
        <h1>Watch the sky, locally</h1>
      </div>

      <p className="lede">
        A Raspberry Pi, a 1090 MHz ADS-B receiver and an FAA registry lookup, running in the
        garage. Every aircraft below is one this antenna heard directly. Nothing is fetched from a
        flight-tracking service.
      </p>

      <DragonfliBoard />
    </div>
  )
}
