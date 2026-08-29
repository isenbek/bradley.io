import Link from "next/link"
import { TrngBoard } from "@/components/trng/TrngBoard"

export default function TrngPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Hotbits</span>
          </span>
        </nav>
        <h1>Random, from radioactive decay</h1>
      </div>

      <p className="lede">
        A CAJOE Geiger counter, a Raspberry Pi, and a comparison of one gap between decay events
        with the next. If the first is shorter the bit is a one, if the second is shorter it is a
        zero, and equal gaps are thrown away.
      </p>

      <div className="prose beta-sec">
        <p>
          Nothing here generates a number. The bias cancels by symmetry rather than by correction,
          which is why the raw stream is worth measuring at all: everything below is that
          measurement, taken continuously and not smoothed.
        </p>
        <p>
          <Link href="/trng/space">See the entropy in 3D</Link>: rotatable point clouds built from
          the same bits.
        </p>
      </div>

      <TrngBoard />
    </div>
  )
}
