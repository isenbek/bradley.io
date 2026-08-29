import Link from "next/link"
import { FleetBoard } from "@/components/fleet/FleetBoard"

export default function FleetPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Fleet</span>
          </span>
        </nav>
        <h1>Fleet health</h1>
      </div>

      <p className="lede">
        Every node in the cluster reports for itself over a UDP bus: disk, temperature, load, radio
        and uplink. This reads the collector that fuses them.
      </p>

      <FleetBoard />
    </div>
  )
}
