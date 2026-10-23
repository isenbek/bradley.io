import { WorldEventBus } from "@/components/dragonfli/worldevent/WorldEventBus"
import { PageHead } from "@/components/page"

export default function Page() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Dragonfli", href: "/dragonfli" }, { label: "Perception bus" }]}
        title="The perception bus"
        lede={
          <>
            A live stream of readings from every sensor on the network: radios, clocks, GPS, nearby Bluetooth devices and aircraft. Six decoders draw the kinds they recognise. Anything else still shows, in a plain view, rather than being dropped.
          </>
        }
      />

      <WorldEventBus />
    </div>
  )
}
