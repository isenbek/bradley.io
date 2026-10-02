import Link from "next/link"
import buildInfo from "@/lib/build-info.json"
import { DeployedAgo } from "@/components/kit/DeployedAgo"

/**
 * HeroChips: the hero's rail of measured facts (the kit's .hero-chips).
 *
 * The kit cut this rail for exactly this: above 80rem the hero's right half
 * was empty, and "the measured chips are the material that belongs there: they
 * are the page's own facts". Each chip is a kit .measured, so each carries the
 * mark that says a run produced it, and each says what period it covers.
 *
 * PROPS
 *   totals   the four org rollups and the author check, summed by the page
 *            (null if no timeline file loaded)
 *
 * ONLY WHAT THE PAGE DOES NOT SAY AGAIN. Three chips, each a fact that appears
 * nowhere else on the front page in this form:
 *   1. which build is answering, and when it went out
 *   2. how many commits are under the owner's own name, from /work's author
 *      check (a dated measurement, and the chip says the date). The page's
 *      org panels count every author; this chip is the hero speaking in the
 *      first person, so it counts only what he wrote, and links the method.
 *   3. when the newest commit in any of the four organisations landed
 * Claude Code minutes and sessions were here once; the live panels directly
 * under the hero and the record's site index carry them, with their caveats.
 *
 * Two chips carry a relative time, which only a browser can know: they print
 * the absolute date on the server and upgrade after mount
 * (components/kit/DeployedAgo.tsx). Dates are sliced from the ISO string.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-10-02..." as "2 Oct 2026", or the input. */
function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : iso
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six"]

export interface OrgTotals {
  orgs: number
  /** Commits under the owner's own name since each org's `since`: AUTHOR_AUDIT's `owner`, summed. */
  ownCommits: number
  /** "YYYY-MM-DD", when the author check was measured. */
  auditedOn: string
  /** Year of the first commit under the owner's name in any org ("2025"). */
  sinceYear: string
  /** ISO stamp of the newest commit in any org, by anyone. */
  latestCommit: string
}

export function HeroChips({ totals }: { totals: OrgTotals | null }) {
  const nf = (n: number) => n.toLocaleString("en-US")

  return (
    <div className="chips hero-chips beta-home-chips" role="group" aria-label="Measured facts about this site">
      <span className="measured">
        <span>
          <b>{buildInfo.version}</b> is the build answering you, deployed{" "}
          <DeployedAgo iso={buildInfo.buildTime} />
        </span>
      </span>

      {totals ? (
        <>
          <span className="measured">
            <span>
              <b>{nf(totals.ownCommits)} commits</b> under my name in{" "}
              {WORDS[totals.orgs] ?? totals.orgs} GitHub organisations since {totals.sinceYear},{" "}
              <Link href="/work#counting">author check of {shortDate(totals.auditedOn)}</Link>
            </span>
          </span>
          {totals.latestCommit ? (
            <span className="measured">
              <span>
                <b>newest commit</b> in any of them <DeployedAgo iso={totals.latestCommit} />
              </span>
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
