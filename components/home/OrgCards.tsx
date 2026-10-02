import Link from "next/link"
import { BarStrip, monthBuckets, type ChartTick } from "@/app/_charts"
import type { OrgRollup } from "@/app/work/_orgs"

/**
 * OrgCards: the four GitHub organisations, one small panel each.
 *
 *   const { orgs } = loadOrgRollups()            // app/work/_orgs.ts
 *   <OrgCards orgs={orgs} end="2026-10-02" />
 *
 * PROPS
 *   orgs   the rollups, in the order to draw them. Read once by the page and
 *          passed in, so the home page and /work cannot disagree about a
 *          total: both come from loadOrgRollups, which reads the same four
 *          timeline files.
 *   end    "YYYY-MM-DD", the newest day the timeline files cover (the day the
 *          newest of them was generated). The strips end in that month.
 *
 * Each panel: the org's name (a link to its section on /work), what it is in
 * the words /work already uses, repositories, commits and the date of the
 * last commit, and a strip of commits per month over the same 24 months in
 * all four panels. The bar says where the count starts ("since 14 Apr 2025"),
 * so the readout labels stay one short word and never wrap on a phone.
 *
 * WHAT "COMMITS" MEANS HERE is what it means on /work, because the numbers are
 * the same fields: each org is counted from `since`, the first commit under
 * the owner's name, so the forks' and imports' older history is in no number
 * and no bar (app/work/_orgs.ts explains the cut and what is still in the
 * count that he did not type). The bar says "since" and the date for that
 * reason, and the page links the method note at /work#counting. The window
 * is shared so the four can be compared in time:
 * an org that began this year shows empty months and then bars, which is what
 * happened. Each strip has its own height scale and prints its tallest month,
 * so heights are NOT comparable across panels and the strip says so itself.
 *
 * Panel, because every figure in it came out of the timeline pipeline. The
 * name on the bar is the only words a person chose.
 *
 * A server component. Dates are sliced from ISO strings.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const STRIP_MONTHS = 24

/** "2026-10-02..." as "2 Oct 2026". Empty string if it does not parse. */
function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return ""
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : ""
}

/** "2026-10" as "Oct 2026". */
function monthName(ym: string): string {
  const month = MONTHS[Number(ym.slice(5, 7)) - 1]
  return month ? `${month} ${ym.slice(0, 4)}` : ym
}

export function OrgCards({ orgs, end }: { orgs: OrgRollup[]; end: string }) {
  const nf = (n: number) => n.toLocaleString("en-US")

  return (
    <div className="beta-home-orgs">
      {orgs.map((org) => {
        const months = monthBuckets(
          org.ownHeatmap.map((d) => ({ date: d.date, value: d.commits ?? 0 })),
          end,
          STRIP_MONTHS,
        ).map((m) => ({ label: monthName(m.label), value: m.value }))
        const inWindow = months.reduce((s, m) => s + m.value, 0)
        const busiest = months.reduce((a, b) => (b.value > a.value ? b : a), months[0])
        // A label every six months, counted back from the newest month so the
        // last tick is always the month in progress.
        const ticks: ChartTick[] = months
          .map((m, i) => ({ at: i, label: m.label }))
          .filter((_, i) => (months.length - 1 - i) % 6 === 0)
        const since = shortDate(org.since)

        return (
          <section key={org.slug} aria-label={org.displayName}>
            <div className="panel">
              <div className="panel-face">
                <div className="panel-bar">
                  <b>
                    <Link className="beta-home-onpanel" href={`/work#${org.slug}`}>
                      {org.displayName}
                    </Link>
                  </b>
                  {since ? <span>since {since}</span> : null}
                </div>

                <p className="beta-org__what">{org.what}</p>

                <table className="readout">
                  <tbody>
                    <tr>
                      <td>Repositories</td>
                      <td className="num">{nf(org.totalRepos)}</td>
                    </tr>
                    <tr>
                      <td>Commits</td>
                      <td className="num">{nf(org.commitsSince)}</td>
                    </tr>
                    <tr>
                      <td>Last commit</td>
                      <td className="num">{shortDate(org.latestCommit) || "not recorded"}</td>
                    </tr>
                  </tbody>
                </table>

                <BarStrip
                  data={months}
                  caption={`Commits per month, ${months[0]?.label ?? ""} to ${months.at(-1)?.label ?? ""}`}
                  summary={
                    `${org.displayName}: ${nf(inWindow)} commits in the ${STRIP_MONTHS} months to ` +
                    `${months.at(-1)?.label ?? end}` +
                    (busiest && busiest.value > 0
                      ? `, the busiest being ${busiest.label} with ${nf(busiest.value)}.`
                      : ".")
                  }
                  unit="commits"
                  ticks={ticks}
                  height={44}
                  emptyNote="This timeline file has no commit days in it."
                />
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
