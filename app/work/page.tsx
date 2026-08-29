import Link from "next/link"
import type { Metadata } from "next"
import { loadOrgRollups, isoYear, type OrgRollup } from "./_orgs"
import { RowChart, RampKey, type RowDatum } from "../_charts"
import { BetaMeasured } from "../_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Work",
  description:
    "Four GitHub organisations rolled up: repositories, commit history and language mix, counted from the commit log rather than described.",
}

/** Commits per calendar year, from the day-level heatmap. */
function commitsByYear(days: OrgRollup["activityHeatmap"]): RowDatum[] {
  const byYear = new Map<string, number>()
  for (const d of days) {
    const y = d.date?.slice(0, 4)
    if (!y) continue
    byYear.set(y, (byYear.get(y) ?? 0) + (d.commits ?? 0))
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, commits]) => ({ label: year, value: commits }))
}

/** Top languages by repo count, with the tail folded into one row. */
function languageRows(langs: OrgRollup["languages"], top = 5): RowDatum[] {
  const head = langs.slice(0, top).map(([name, n]) => ({
    label: name,
    value: n,
    display: `${n} ${n === 1 ? "repo" : "repos"}`,
  }))
  const tail = langs.slice(top)
  if (tail.length) {
    const n = tail.reduce((s, [, v]) => s + v, 0)
    // A ninth hue is never generated; the tail folds into one row. Same rule
    // for a ninth series applies to a ninth category.
    head.push({ label: `Other (${tail.length})`, value: n, display: `${n} repos` })
  }
  return head
}

/**
 * How many repositories the language breakdown does not account for.
 *
 * The pipeline records a single primary language per repository and records
 * nothing for a repo it could not classify, so these rows sum to less than the
 * repository count, sometimes by a lot: isenbek reports 13 repositories and 7
 * classified. A chart captioned "repositories by language" that quietly drops
 * six of them is the kind of gap STYLE.md means by "say what is not covered".
 */
function unclassified(org: OrgRollup): number {
  const counted = org.languages.reduce((s, [, n]) => s + n, 0)
  return Math.max(0, org.totalRepos - counted)
}

export default function BetaWorkPage() {
  const { orgs, expected } = loadOrgRollups()

  const totalRepos = orgs.reduce((s, o) => s + o.totalRepos, 0)
  const totalCommits = orgs.reduce((s, o) => s + o.totalCommits, 0)
  const earliest = orgs.map((o) => o.firstCommit).filter(Boolean).sort()[0] ?? ""
  const newest = orgs.map((o) => o.generated).filter(Boolean).sort().at(-1)

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Work</span>
          </span>
        </nav>
        <h1>Work</h1>
      </div>

      <p className="lede">
        Four GitHub organisations, {isoYear(earliest) || "2016"} to now.{" "}
        {totalRepos.toLocaleString()} repositories and {totalCommits.toLocaleString()} commits,
        counted from the log rather than described.
      </p>

      {/* .prose for the text run only; the panels below are siblings. See the
          note in app/page.tsx for why they are not nested inside it. */}
      <div className="prose beta-sec">
        <p>
          This is the org-level view on purpose. The per-repository write-ups moved out of this
          site; what is useful here is the shape of the work, not a directory of it.
        </p>
      </div>

      {orgs.length < expected && (
        <div className="notice fail">
          <b>Incomplete.</b> {orgs.length} of {expected} timelines loaded. The missing files did not
          parse, so the totals above are short by whatever they contain.
        </div>
      )}

      <RampKey low="fewer commits" high="more" />

      <div className="beta-orggrid">
        {orgs.map((org) => {
          const years = commitsByYear(org.activityHeatmap)
          const langs = languageRows(org.languages)
          const span = [isoYear(org.firstCommit), isoYear(org.latestCommit)]
            .filter(Boolean)
            .join(" to ")

          return (
            <section key={org.slug} aria-label={org.displayName}>
              <div className="panel">
                <div className="panel-face">
                  <div className="panel-bar">
                    <b>{org.displayName}</b>
                    <span>{span}</span>
                  </div>

                  <p className="beta-org__what">{org.what}</p>

                  <table className="readout">
                    <tbody>
                      <tr>
                        <td>Repositories</td>
                        <td className="num">{org.totalRepos.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Commits</td>
                        <td className="num">{org.totalCommits.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Languages</td>
                        <td className="num">{org.languages.length.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <RowChart
                    caption="Commits per year"
                    data={years}
                    emptyNote="No dated commits in this timeline."
                  />

                  <RowChart
                    caption="Repositories by primary language"
                    data={langs}
                    emptyNote="No languages recorded."
                  />
                  {unclassified(org) > 0 && (
                    <p className="beta-chart__note">
                      {unclassified(org).toLocaleString()} of {org.totalRepos.toLocaleString()}{" "}
                      repositories have no primary language recorded and are not in this chart.
                    </p>
                  )}
                </div>
              </div>

              {org.gh && (
                <p className="quiet">
                  <a href={org.gh} target="_blank" rel="noopener noreferrer">
                    github.com/{org.displayName}
                  </a>
                </p>
              )}
            </section>
          )
        })}
      </div>

      <BetaMeasured generated={newest} source="four mission timelines" />
    </div>
  )
}
