import type { Metadata } from "next"
import Link from "next/link"
import { KnockBoard } from "@/components/visitors/KnockBoard"

// Unlisted while the tiers get built out: no index, not in the sitemap.
// Reachable by URL and from the site menu only.
export const metadata: Metadata = {
  title: "Who knocked",
  description:
    "Every request that reached this host across every site it serves, in three tiers: dropped at the edge, trapped at the door, and served.",
  robots: { index: false, follow: false },
}

export default function VisitorsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Who knocked</span>
          </span>
        </nav>
        <h1>Who knocked</h1>
      </div>

      <p className="lede">
        Almost everything that arrives at this host is automated. This page fuses the three places
        that see it: the OpenWrt router at the edge, which drops known-hostile addresses before they
        reach the server at all; the scanner trap in nginx, which kills probes for software I do not
        run; and the access logs, which are what is left over. The leftovers are the people.
      </p>

      <div className="notice">
        <b>Visitors are coarsened on purpose.</b> A /24 network, a city, and a network operator. No
        visitor IP address is stored in the snapshot or served by the API. Unsolicited automated
        traffic gets no such courtesy and is shown in full.
      </div>

      <KnockBoard />
    </div>
  )
}
