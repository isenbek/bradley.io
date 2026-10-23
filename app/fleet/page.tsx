import { FleetBoard } from "@/components/fleet/FleetBoard"
import { PageHead } from "@/components/page"

export default function FleetPage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Fleet" }]}
        title="Fleet health"
        lede={
          <>
            Every computer in the cluster reports for itself: disk, temperature, load, radio and
            internet link. This page reads the collector that gathers those reports.
          </>
        }
      />

      <FleetBoard />
    </div>
  )
}
