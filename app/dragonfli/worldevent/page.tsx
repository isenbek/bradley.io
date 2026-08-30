import Link from "next/link"
import { WorldEventBus } from "@/components/dragonfli/worldevent/WorldEventBus"

export default function Page() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <Link href="/dragonfli">Dragonfli</Link>
          </span>
          <span>
            {" / "}
            <span aria-current="page">Perception bus</span>
          </span>
        </nav>
        <h1>The perception bus</h1>
      </div>

      <p className="lede">
        A schema-tagged UDP firehose from every sensor on the network: mesh radios, clocks, GPS, Bluetooth census, ADS-B. Six decoders render what they recognise; anything else falls back to a generic view rather than being dropped.
      </p>

      <WorldEventBus />
    </div>
  )
}
