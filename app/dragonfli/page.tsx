import { DragonfliBoard } from "@/components/dragonfli/DragonfliBoard"
import { PageHead } from "@/components/page"

export default function DragonfliPage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Dragonfli" }]}
        title="Watch the sky, locally"
        lede={
          <>
            A Raspberry Pi and an aircraft-tracking radio (ADS-B) in the garage, with each plane
            looked up in the FAA registry. Every aircraft below is one this antenna heard directly.
            Nothing comes from a flight-tracking service.
          </>
        }
      />

      <DragonfliBoard />
    </div>
  )
}
