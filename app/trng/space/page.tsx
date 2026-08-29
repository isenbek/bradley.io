import Link from "next/link"
import { V3EntropySpace } from "./V3EntropySpace"

export default function EntropySpacePage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <Link href="/trng">Hotbits</Link>
          </span>
          <span>
            {" / "}
            <span aria-current="page">Entropy space</span>
          </span>
        </nav>
        <h1>The entropy in three dimensions</h1>
      </div>

      <p className="lede">
        Bytes from the pool, plotted as coordinates. A biased source draws structure here: planes,
        lattices, clumps. A good one draws a featureless cube, which is the least interesting
        picture a generator can produce and exactly the one it should.
      </p>

      {/* WebGL instrument, styling of its own. See .kit-island in app/kit.css. */}
      <div className="v3 kit-island">
        <V3EntropySpace />
      </div>
    </div>
  )
}
