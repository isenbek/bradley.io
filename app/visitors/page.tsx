import type { Metadata } from "next"
import { KnockBoard } from "@/components/visitors/KnockBoard"
import { PageHead } from "@/components/page"

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
      <PageHead
        crumbs={[{ label: "Who knocked" }]}
        title="Who knocked"
        lede={
          <>
            Almost everything that arrives at this server is automated. This page combines the three
            places that see it. The router at the edge blocks known-hostile addresses before they
            reach the server. A trap in the web server turns away probes for software I do not run.
            The access logs hold what is left over, and the leftovers are the people.
          </>
        }
      />

      <div className="notice">
        <b>Visitors are coarsened on purpose.</b> A /24 network, a city, and a network operator. No
        visitor IP address is stored in the snapshot or served by the API. Unsolicited automated
        traffic gets no such courtesy and is shown in full.
      </div>

      <KnockBoard />
    </div>
  )
}
