import Link from "next/link"
import { readFileSync } from "fs"
import { join } from "path"
import { CalendarHeat, Sparkline, weekBuckets, type DayDatum } from "../_charts"
import { BetaMeasured } from "../_measured"
import { Grid, PageHead, Section } from "@/components/page"

/**
 * /walk-ins: the full-time search, in the open.
 *
 * The owner's words (2026-10-13): "a gorgeous 1 page resume that I can drop
 * off with companies in the area ... Me -> Front Desk -> Resume. Going in
 * blind", and "start up a new (public of course) page as we openly and
 * honestly go through this process". So this page is the log of that: the
 * sheet, the circle of companies, the record behind the numbers on the sheet,
 * and a dated entry for every step, including the ones that go nowhere.
 *
 * WHAT IS PUBLIC AND WHAT IS NOT. Company names are public; the people met
 * are not, ever. Home is "Kentwood, Michigan", and the companies are listed
 * in three distance bands, never with a distance, because a list of exact
 * distances from one point is that point. The sheet shown here is the one
 * handed over, minus the phone number: the site's contact page is email.
 * Nothing on this page is sent, posted or decided by an AI; the walking is
 * done by a person, the writing is done together, and it says so.
 *
 * DATA. public/data/walk-ins.json (scripts/walk-ins/nearby.py, from a private
 * OpenStreetMap pull and a private geocoded list, bands only) and
 * public/data/claude-record.json (scripts/claude-record/splice.py: the old
 * site's committed snapshots for 2025-12-11 to 2026-03-07, the activity
 * database from 2026-03-08, and active time from the parquet export). The
 * log is written by hand in LOG below, newest first.
 */

export const revalidate = 3600

interface WalkInsData {
  generated: string
  centre: string
  radiusMiles: number
  bands: string[]
  sources: Record<string, string>
  counts: { kept: number; droppedFromOsm: number; byBand: Record<string, number> }
  rows: { name: string; kind: string; band: string; source: string }[]
}

interface ClaudeRecord {
  generated: string
  first: string
  last: string
  calendarDays: number
  activeDays: number
  messages: number
  sessions: number
  toolCalls: number
  early: { activeDays: number; messages: number; sessions: number; from: string; to: string }
  db: { activeDays: number; messages: number; sessions: number; toolCalls: number; from: string; to: string }
  activeTime: {
    since: string
    through: string
    hours: number
    minutesWithTurn: number
    hoursTouched: number
    definition: string
    byMonth: { month: string; hours: number }[]
  } | null
  note: string
  days: { date: string; messages: number; sessions: number; toolCalls: number; source: string }[]
}

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "public/data", file), "utf-8")) as T
}

/** The log, newest first. Dates are the day the thing happened, not the deploy. */
const LOG: { date: string; title: string; text: string }[] = [
  {
    date: "2026-10-13",
    title: "Doors knocked: none yet.",
    text: "A print test on 65 lb cardstock through the printer's manual slot is next, then the first walk. Every door goes here, including the ones that lead nowhere.",
  },
  {
    date: "2026-10-13",
    title: "The record.",
    text: "The whole Claude Code history, spliced from the old site's committed snapshots (December to early March) and the activity database (since 8 March), with time counted as five-minute buckets that held a message. The gaps are gaps; nothing is estimated.",
  },
  {
    date: "2026-10-13",
    title: "The circle.",
    text: "Named workplaces within five miles of home, from OpenStreetMap plus the larger employers known to be there, geocoded by address. Shops, clinics, bars and trades were dropped and the count of what was dropped is kept. Published in bands, never exact distances.",
  },
  {
    date: "2026-10-13",
    title: "The sheet.",
    text: "Three one-page versions from one markdown source (hybrid, full-time first, plain text), then the one that stuck: readouts with sparklines read from live data, the career as a band, a diagram of how AI gets wired into a business, a heat strip of every day with Claude Code, and a footer bar with the sources. Built together with Claude Code in an afternoon.",
  },
]

const BAND_LABEL: Record<string, string> = {
  "under 2": "Under two miles",
  "2 to 3.5": "Two to three and a half miles",
  "3.5 to 5": "Three and a half to five miles",
}

function fmt(n: number) {
  return n.toLocaleString("en-US")
}

export default function WalkInsPage() {
  const circle = load<WalkInsData>("walk-ins.json")
  const record = load<ClaudeRecord>("claude-record.json")

  const days: DayDatum[] = record.days.map((d) => ({ date: d.date, value: d.messages }))
  const weeks = Math.ceil(record.calendarDays / 7)
  const weekly = weekBuckets(days, record.last, weeks)
  const peakWeek = Math.max(...weekly)
  const perActiveDay = Math.round(record.messages / record.activeDays)

  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Walk-ins" }]}
        title="Walk-ins"
        lede={
          <>
            A one-page resume, a five-mile circle around home in Kentwood, Michigan, and every door,
            logged here as it happens. I am looking for a full-time role in AI systems and data
            architecture, or the right contract, and I would rather do the looking in the open.
          </>
        }
      />

      <Section title="The idea">
        <p>
          Me, the front desk, the sheet. No portals, no forms, no recruiter in the middle. Companies
          of every stripe are trying to work out what AI means for them, and most of them are within
          a short drive of my house. So I walk in with one page that says what I do and shows the
          work, and leave it with whoever is at the desk. What happens next is written down here,
          the same day, whether it is a conversation or silence.
        </p>
        <h2>The rules</h2>
        <ul>
          <li>Company names are public. The people I meet are not, ever, unless they ask to be.</li>
          <li>
            Home is &ldquo;Kentwood, Michigan&rdquo;. The companies below are listed in three distance
            bands, never with a distance: a list of exact distances from one point is that point.
          </li>
          <li>
            The sheet shown here is the one handed over, minus the phone number. The way to reach me
            from this site is <Link href="/contact">email</Link>.
          </li>
          <li>
            Nothing here is sent, posted or decided by an AI. The walking is mine; the sheet and this
            page were written together with Claude Code, and the record of that is on the page too.
          </li>
          <li>Every step is dated, including the ones that go nowhere.</li>
        </ul>
      </Section>

      <Section title="The sheet">
        <p>
          One page, US Letter. The readouts are read from this site&rsquo;s own data files on the day it
          is built, the career is drawn as a band, and the credit for the die photograph is in the
          footer. The full record is on <Link href="/resume">the resume page</Link>; this is the
          version that fits in a hand.
        </p>
      </Section>
      <figure className="beta-walkins-sheet">
        <a href="/walk-ins/sheet.pdf">
          <img src="/walk-ins/sheet.png" alt="The one-page walk-in resume: readouts with sparklines, a career band, a diagram, and a heat strip of days with Claude Code" width={1020} height={1320} />
        </a>
        <figcaption>
          The walk-in sheet, 13 October 2026. <a href="/walk-ins/sheet.pdf">PDF</a>, without the phone
          number.
        </figcaption>
      </figure>

      <Section title="The circle">
        <p>
          {fmt(circle.counts.kept)} workplaces within {circle.radiusMiles} miles of home that a person
          might walk into with a resume about AI and data: manufacturers, engineering and software
          firms, insurers, health systems, universities, publishers, public bodies. From OpenStreetMap
          and a list of the larger employers known to be there, geocoded by address;{" "}
          {fmt(circle.counts.droppedFromOsm)} map entries were dropped (shops, clinics, bars, trades)
          and that cut is on the record in the data file.
        </p>
      </Section>
      <Grid min="18rem" className="beta-walkins-bands">
        {circle.bands.map((band) => {
          const rows = circle.rows.filter((r) => r.band === band)
          return (
            <section key={band} className="panel beta-walkins-band" aria-label={BAND_LABEL[band]}>
              <div className="panel-face">
                <div className="panel-bar beta-inst-bar">
                  <b>{BAND_LABEL[band]}</b>
                  <span className="tag">{rows.length}</span>
                </div>
                <ul className="beta-walkins-list">
                  {rows.map((r) => (
                    <li key={r.name}>
                      <span className="beta-walkins-name">{r.name}</span>
                      <span className="beta-walkins-kind">{r.kind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )
        })}
      </Grid>
      <BetaMeasured generated={circle.generated} source="public/data/walk-ins.json">
        OpenStreetMap (ODbL) and Nominatim, bands only.
      </BetaMeasured>

      <Section title="The record behind the sheet">
        <p>
          The sheet says how much of this year was built with Claude Code. This is where that number
          comes from, all of it: the old site&rsquo;s committed snapshots for{" "}
          {record.early.from} to {record.early.to}, which counted the session logs still on disk the
          day they ran, and the activity database from {record.db.from}. Days the snapshots do not
          hold are days with no count. Time is counted as five-minute buckets with a message in them,
          which only exists since {record.db.from}; a session&rsquo;s open span is not time, because a
          session here stays open for weeks.
        </p>
      </Section>
      <div className="panel">
        <div className="panel-face">
          <div className="beta-walkins-readouts">
            <div>
              <b>{fmt(record.activeDays)}</b>
              <span>active days of {fmt(record.calendarDays)}</span>
              <small>
                {record.first} to {record.last}
              </small>
            </div>
            <div>
              <b>{(record.messages / 1e6).toFixed(2)}M</b>
              <span>messages</span>
              <small>{fmt(perActiveDay)} on an active day</small>
            </div>
            <div>
              <b>{record.activeTime ? fmt(record.activeTime.hours) : "n/a"}</b>
              <span>active hours since {record.db.from}</span>
              <small>{record.activeTime ? `${fmt(record.activeTime.minutesWithTurn)} minutes held a message` : "no turn-level data"}</small>
            </div>
            <div>
              <b>{fmt(record.toolCalls)}</b>
              <span>tool calls</span>
              <small>files read, commands run, edits made</small>
            </div>
            <div>
              <b>{fmt(peakWeek)}</b>
              <span>messages in the busiest week</span>
              <Sparkline values={weekly} label={`Messages a week, ${record.first} to ${record.last}: the shape of the year`} width={160} height={28} />
            </div>
          </div>
          <CalendarHeat
            days={days}
            caption={`Messages a day with Claude Code, ${record.first} to ${record.last}`}
            summary={`${fmt(record.activeDays)} active days of ${fmt(record.calendarDays)}; the busiest week carried ${fmt(peakWeek)} messages.`}
            unit="messages"
            start={record.first}
            end={record.last}
          />
        </div>
      </div>
      <BetaMeasured generated={record.generated} source="public/data/claude-record.json">
        git 59a0b6c and c648db2 for the early months; data/claude-activity.duckdb and the parquet
        export from 2026-03-08.
      </BetaMeasured>

      <Section title="The log">
        <p>Newest first. The date is the day it happened.</p>
      </Section>
      <div className="ledger beta-walkins-log">
        <div className="scroller">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Entry</th>
              </tr>
            </thead>
            <tbody>
              {LOG.map((e, i) => (
                <tr key={i}>
                  <td>{e.date}</td>
                  <td>
                    <b>{e.title}</b> {e.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Section title="Hiring?">
        <p>
          The door works both ways. <Link href="/contact">Email</Link> is the front door, and{" "}
          <Link href="/resume">the resume</Link> has the whole record since 1997.
        </p>
      </Section>
    </div>
  )
}
