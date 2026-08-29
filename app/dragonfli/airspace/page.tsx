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

      {/* The instrument keeps its own styling. See .kit-island in app/kit.css
          for why .v3 stays on this wrapper. */}
      <div className="v3 kit-island">
        <V3Airspace />
      </div>
    </div>
  )
}
