import Link from "next/link"
import { TenureBars, parseYears, type TenureRow } from "@/app/_charts"
import { BetaMeasured } from "@/app/_measured"
import { longDate } from "@/app/_pilot-data"
import { EARLIER_ROLES, RESUME_UPDATED, ROLES, type ResumeRole } from "@/lib/resume"
import { CAREER_LINES } from "./content"

/**
 * "Where the time went": the career, twice.
 *
 * First as a shape. Every role in lib/resume.ts is one bar on one axis, 1997
 * to the date the resume was last confirmed. That is a chart, so it sits on a
 * panel, and "present" means the resume's date and not today's.
 *
 * Then as words, on paper: six of the roles in one line each. The names, the
 * titles and the years are the resume's (lib/resume.ts, the one source); the
 * line is his own from the original About page (components/about/content.ts,
 * CAREER_LINES). It is a short list on purpose. /resume tells every role in
 * full, in the resume's sentences and the resume's typography, and this page
 * is not that page again: the bars carry the shape, six lines carry the
 * highlights, and one link carries the rest.
 *
 * The page used to print four rows from site-data.json with the employers
 * anonymised ("Enterprise Messaging Platform") in a ledger whose cells do not
 * wrap, so the text ran off the right edge. Both are gone: one source, real
 * names, and a layout that wraps.
 */

const ALL: ResumeRole[] = [...ROLES, ...EARLIER_ROLES]

/** A small count as a word, the way a sentence wants it. */
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"]
const inWords = (n: number) => WORDS[n] ?? String(n)

export function Career() {
  const rows: TenureRow[] = ALL.flatMap((r) => {
    const y = parseYears(r.years)
    return y ? [{ label: r.company, sub: r.title, ...y }] : []
  })
  const first = Math.min(...rows.map((r) => r.start))
  const open = rows.filter((r) => r.end === "present").length
  const asOf = longDate(RESUME_UPDATED) ?? RESUME_UPDATED

  const told = ALL.filter((r) => r.company in CAREER_LINES)
  const untold = ALL.filter((r) => !(r.company in CAREER_LINES))
  const untoldYears = untold.flatMap((r) => {
    const y = parseYears(r.years)
    return y ? [y.start, typeof y.end === "number" ? y.end : y.start] : []
  })
  const untoldFrom = Math.min(...untoldYears)
  const untoldTo = Math.max(...untoldYears)

  return (
    <>
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Career</b>
            <span>
              {rows.length} roles, {first} to the resume date
            </span>
          </div>
          <TenureBars
            caption={`Roles by calendar year, ${first} to ${asOf}`}
            summary={`${rows.length} roles from ${first} to the present, ${open} of them current as of ${asOf}.`}
            rows={rows}
            asOf={RESUME_UPDATED}
          />
        </div>
      </div>
      <div className="beta-about-chip">
        <BetaMeasured source="lib/resume.ts">
          <b>lib/resume.ts</b>, from the resume dated {asOf}. Year resolution: each end of a bar
          is right to within a year.
        </BetaMeasured>
      </div>

      <ol className="beta-about-roles" aria-label="Six of the roles, one line each">
        {told.map((r) => (
          <li key={`${r.company}-${r.years}`}>
            <span className="beta-about-roles__when">{r.years}</span>
            <span className="beta-about-roles__who">
              <b>{r.company}</b>
              <span>{r.title}</span>
            </span>
            <span className="beta-about-roles__what">{CAREER_LINES[r.company]}</span>
          </li>
        ))}
      </ol>

      <p className="beta-about-more">
        {inWords(untold.length)} more roles between {untoldFrom} and {untoldTo} are bars above and not
        told here, among them card payments, e-commerce, invoicing, and a case management system
        for a district attorney. <Link href="/resume">The resume has every one</Link>.
      </p>
    </>
  )
}
