import Link from "next/link"
import { V3Airspace } from "./V3Airspace"

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
            <span aria-current="page">Airspace</span>
          </span>
        </nav>
        <h1>The airspace map</h1>
      </div>

      <p className="lede">
        Live tracks over a local basemap, with a density layer built from what this receiver has heard rather than from a feed.
      </p>

      <V3Airspace />
    </div>
  )
}
