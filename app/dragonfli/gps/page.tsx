import Link from "next/link"
import { V3Gps } from "./V3Gps"

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
            <span aria-current="page">GPS</span>
          </span>
        </nav>
        <h1>The receiver's own fix</h1>
      </div>

      <p className="lede">
        Where the antenna thinks it is, and which satellites it is using to decide. A skyplot of the constellation overhead.
      </p>

      <V3Gps />
    </div>
  )
}
