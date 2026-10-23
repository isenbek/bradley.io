import { V3Airspace } from "./V3Airspace"
import { PageHead } from "@/components/page"

export default function Page() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Dragonfli", href: "/dragonfli" }, { label: "Airspace" }]}
        title="The airspace map"
        lede={
          <>
            Aircraft tracks over a local map, shaded by how often this receiver has heard planes in each spot. Nothing comes from a feed. The panel below says whether the antenna is hearing anything right now.
          </>
        }
      />

      <V3Airspace />
    </div>
  )
}
