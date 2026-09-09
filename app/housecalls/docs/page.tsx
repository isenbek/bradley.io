import Link from "next/link"
import type { Metadata } from "next"
import { readAllDocsMeta, type HuntDocMeta } from "@/lib/housecalls/docs"

const DESCRIPTION =
  "The hunt's paperwork, readable where the hunt lives: every plan, letter template, rule, and recipe behind housecalls.bradley.io, rendered from the same files the repo carries."

export const metadata: Metadata = {
  title: "The Paperwork",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/docs" },
  openGraph: {
    title: "House Calls: the paperwork",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/docs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "House Calls: the paperwork",
    description: DESCRIPTION,
  },
}

/**
 * Curated sections over a derived inventory. The section map names slugs;
 * anything on disk it does not name renders in "The rest" below, so a new
 * doc appears here the moment it is committed, filed or not. The index can
 * go unsorted; it cannot go incomplete.
 */
const SECTIONS: { heading: string; blurb: string; slugs: string[] }[] = [
  {
    heading: "Start here",
    blurb: "What this is, in increasing length, and the board it runs on.",
    slugs: ["elevator-pitch", "summary", "opportunities", "operator-tasks"],
  },
  {
    heading: "The rules",
    blurb: "The gates a prospect passes, what replies trigger, and the numbers letters may cite.",
    slugs: ["qualification-rubric", "reply-playbook", "letter-ammo"],
  },
  {
    heading: "The letters",
    blurb:
      "Every template a letter can be drafted from. Individual letters are correspondence and stay private; templates are policy and stay public.",
    slugs: [
      "pitch-legacy-rescue",
      "pitch-honest-ai",
      "pitch-cloud-exit",
      "pitch-hiring-signal",
      "pitch-farm-grant",
      "pitch-story",
    ],
  },
  {
    heading: "The farm vertical",
    blurb: "Statewide, per the operator's order. Farms deal with all the trades.",
    slugs: ["farm-harvest-notes", "deere-sandbox"],
  },
  {
    heading: "Tools for the trades",
    blurb: "Free field tools that report to no one, and the listening that shaped them.",
    slugs: ["trades-temperature", "truck-pad-plan", "counter-cards", "local-harness-plan"],
  },
  {
    heading: "The machine",
    blurb: "How the pipelines, maps, mail, and fleet actually work.",
    slugs: [
      "harvest-seam-plan",
      "sending-domain-design",
      "maps-plan",
      "p2-pin-schema",
      "cbcli-fleet-usage",
      "mi-business-registry",
    ],
  },
  {
    heading: "Franchise and pilot",
    blurb: "Replicating the machine for another operator, terms first.",
    slugs: [
      "franchise-sketch",
      "operator-config",
      "operator-standup",
      "template-repo-plan",
      "pitch-pilot-operator",
      "pilot-terms-memo",
      "pilot-support-plan",
      "nominate-workspace-ask",
    ],
  },
  {
    heading: "Recipes",
    blurb: "Infrastructure steps that worked, written to be repeated.",
    slugs: ["subdomain-recipe", "tile-recipe"],
  },
]

function DocRow({ doc }: { doc: HuntDocMeta }) {
  return (
    <li className="beta-doc-row">
      <Link href={`/housecalls/docs/${doc.slug}`}>{doc.title}</Link>
      {doc.updated ? <span className="beta-doc-date"> · {doc.updated}</span> : null}
      {doc.status ? <span className="beta-doc-status">{doc.status}</span> : null}
    </li>
  )
}

export default function HuntDocsIndex() {
  const all = readAllDocsMeta()
  const bySlug = new Map(all.map((d) => [d.slug, d]))
  const claimed = new Set(SECTIONS.flatMap((s) => s.slugs))
  const rest = all
    .filter((d) => !claimed.has(d.slug))
    .sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""))
  const latest = all.reduce((m, d) => ((d.updated ?? "") > m ? (d.updated as string) : m), "")

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/housecalls/docs",
            name: "House Calls: the paperwork",
            url: "https://bradley.io/housecalls/docs",
            description: DESCRIPTION,
            isPartOf: { "@type": "WebSite", name: "bradley.io", url: "https://bradley.io" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "House Calls", item: "https://bradley.io/housecalls" },
                { "@type": "ListItem", position: 3, name: "The Paperwork", item: "https://bradley.io/housecalls/docs" },
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
              <span aria-current="page">The Paperwork</span>
            </span>
          </nav>
          <h1>The paperwork, in the open too.</h1>
        </div>

        <p className="lede">
          {all.length} working documents behind the hunt: plans, letter templates, rules, and
          recipes, rendered from the same committed files the repo carries. This index derives from
          the files themselves (latest change {latest}); a new document appears here the moment it
          ships. What never appears: correspondence, prospects, or anything with a person&apos;s
          contact details, which live outside the public tree by design.
        </p>

        {SECTIONS.map((sec) => {
          const docs = sec.slugs
            .map((s) => bySlug.get(s))
            .filter((d): d is HuntDocMeta => Boolean(d))
          if (docs.length === 0) return null
          return (
            <section className="beta-doc-sec" key={sec.heading}>
              <div className="prose">
                <h2>{sec.heading}</h2>
                <p>{sec.blurb}</p>
              </div>
              <ul className="beta-doc-list">
                {docs.map((d) => (
                  <DocRow key={d.slug} doc={d} />
                ))}
              </ul>
            </section>
          )
        })}

        {rest.length > 0 ? (
          <section className="beta-doc-sec">
            <div className="prose">
              <h2>The rest</h2>
              <p>
                Committed but not yet filed into a section above. Nothing waits for curation to be
                readable.
              </p>
            </div>
            <ul className="beta-doc-list">
              {rest.map((d) => (
                <DocRow key={d.slug} doc={d} />
              ))}
            </ul>
          </section>
        ) : null}

        <p className="hero-ctas">
          <Link className="btn" href="/housecalls">
            Back to the hunt
          </Link>
        </p>
      </div>
    </>
  )
}
