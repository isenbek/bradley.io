import Link from "next/link"
import type { Metadata } from "next"

const DESCRIPTION =
  "House Calls is a method, and methods replicate. The territory map of who runs the machine where: currently a network of one, stated plainly, with the door open for the second."

export const metadata: Metadata = {
  title: "The Network",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/network" },
  openGraph: {
    title: "The House Calls network",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/network",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The House Calls network",
    description: DESCRIPTION,
  },
}

/**
 * The network page: who runs a House Calls machine, where. Honest at every
 * size, which today means honest about being a network of one. Grows a row at
 * a time; territory is counties, per the operator config seam
 * (docs/housecalls/operator-config.md).
 */

interface TerritoryRow {
  territory: string
  operator: string
  since: string
  status: string
  href: string | null
}

const TERRITORIES: TerritoryRow[] = [
  {
    territory: "West Michigan (Kent + the ring)",
    operator: "Bradley Isenbek",
    since: "2026-09-05",
    status: "flagship, mid-hunt",
    href: "/housecalls",
  },
]

export default function NetworkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://bradley.io/housecalls/network",
            name: "The House Calls network",
            url: "https://bradley.io/housecalls/network",
            description: DESCRIPTION,
            isPartOf: { "@type": "WebSite", name: "bradley.io", url: "https://bradley.io" },
            author: { "@id": "https://bradley.io/#person" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "House Calls",
                  item: "https://bradley.io/housecalls",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "The Network",
                  item: "https://bradley.io/housecalls/network",
                },
              ],
            },
          }),
        }}
      />
      <div className="page">
        <div className="page-head">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">bradley.io</Link>
            <span>
              {" / "}
              <Link href="/housecalls">House Calls</Link>
              {" / "}
              <span aria-current="page">The Network</span>
            </span>
          </nav>
          <h1>The network. Population: one.</h1>
        </div>

        <p className="lede">
          House Calls is a method, and methods replicate. This page is the map of who runs the
          machine where. It has one row, because honesty at every size is the method, and today
          the size is one.
        </p>

        <div className="prose beta-sec">
          <h2>What an operator is</h2>
          <p>
            One skilled engineer, one territory, one machine on hardware they own. Their AI
            harvests, maps, qualifies, and drafts; they read and sign everything before it goes
            anywhere; the whole hunt runs on a public page like{" "}
            <Link href="/housecalls">this one</Link>. The kit is the same for everyone. The
            biography is not.
          </p>

          <h2>The rules that do not bend</h2>
          <p>
            Every operator runs the same doctrine, and it is not adjustable: an AI drafts and a
            human signs; every message discloses the AI; one email, and a no means no forever; no
            cold text messages, ever; government bodies through procurement only; correspondence
            stays private; the ledger stays honest, misses included. The shared rules are the
            network: every operator&apos;s honest ledger vouches for every other one.
          </p>

          <h2>Territories</h2>
          <p>
            Territory is counties. One operator per territory, first come, and each machine maps
            only its own.
          </p>
        </div>

        <div className="ledger">
          <div className="scroller" tabIndex={0} role="region" aria-label="Territory ledger">
            <table>
              <thead>
                <tr>
                  <th>Territory</th>
                  <th>Operator</th>
                  <th>Since</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="name">
                    {TERRITORIES[0].href ? (
                      <Link href={TERRITORIES[0].href}>{TERRITORIES[0].territory}</Link>
                    ) : (
                      TERRITORIES[0].territory
                    )}
                  </td>
                  <td>{TERRITORIES[0].operator}</td>
                  <td>{TERRITORIES[0].since}</td>
                  <td>
                    <span className="tag">{TERRITORIES[0].status}</span>
                  </td>
                </tr>
                <tr>
                  <td className="name">Everywhere else</td>
                  <td>open</td>
                  <td>{""}</td>
                  <td>
                    <span className="tag">unclaimed</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="tbl-foot">
              <span>{TERRITORIES.length} operator on the map</span>
            </div>
          </div>
        </div>

        <div className="prose beta-sec">
          <h2>Where this stands, honestly</h2>
          <p>
            The flagship machine is built, public, and mid-hunt; it has not yet won its first
            engagement, and a network sells nothing it has not proven. So the sequence is
            published here the same as everything else: the flagship wins first. Then one pilot
            operator, hand-picked and free, proves the machine transfers to a different human in
            a different city. The invitation letter for that pilot is already drafted and, like
            every letter in this operation, waits on the human&apos;s signature. Paying
            territories, if they ever exist, come after both, designed with counsel.
          </p>

          <h2>Want to be the second row?</h2>
          <p>
            The pilot will be someone we already trust, so the honest advice is: start a
            conversation, not an application. If you are a skilled engineer who wants to run
            work-finding in the open, on your own metal, under rules that do not bend, say hello
            and tell us your county.
          </p>
        </div>

        <p className="hero-ctas">
          <Link className="btn btn-primary" href="/contact">
            Say hello
          </Link>
          <Link className="btn" href="/housecalls">
            Watch the flagship hunt
          </Link>
        </p>
      </div>
    </>
  )
}
