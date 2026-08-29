import Link from "next/link"
import { SdrBoard } from "@/components/sdr/SdrBoard"

export default function SdrPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">SDR</span>
          </span>
        </nav>
        <h1>The scanner stack</h1>
      </div>

      <p className="lede">
        Software-defined radios on bali.lan, sweeping VHF and 802.15.4 and writing what comes back
        above threshold to an archive. This reads the control plane in front of them.
      </p>

      <SdrBoard />
    </div>
  )
}
