import Link from "next/link"
import { RESUME_PDF, RESUME_UPDATED, ROLES, EARLIER_ROLES } from "@/lib/resume"
import { peekNow } from "@/components/live/now-snapshot"
import { Built } from "@/components/about/Built"
import { Career } from "@/components/about/Career"
import { SiteRows } from "@/components/about/SiteRows"
import {
  LEDE,
  NOW,
  PHILOSOPHY,
  SKILLS,
  SKILLS_LINE,
  STILL_TRUE,
  TITLE,
} from "@/components/about/content"
import { Actions, ReadMore } from "@/components/page"
import { BetaMeasured } from "../_measured"
import { loadPilotData, longDate } from "../_pilot-data"

/**
 * /about: the person, in his own words, then the record.
 *
 * The order is the order a stranger asks in: who is this, what is he doing
 * now, where has he been, what does he know, what has he written, and how is
 * this site itself made.
 *
 * Paper for everything a person wrote. One panel, for the one thing that was
 * computed: the career drawn on a time axis.
 *
 * THE /about PASS (Brad, 2026-10-23). The repeats came down: the career's six
 * lines and the skills list sit in folds, Writing is one line to the Meatball
 * page (which lists the notes), and the site index panel went (home and /work
 * carry those counts). The page ends on the hiring line, as home opens on it.
 * The lede and Philosophy stay in his words. The copy and
 * its sources are in components/about/content.ts; the career is lib/resume.ts.
 * Metadata is in ./layout.tsx.
 *
 * The status rows on the "This site" card and the dot under Claude's name are
 * the page's only live elements. Each is unlit until the snapshot or the
 * shared /api/now poll proves otherwise, so with every box off the page is
 * still and says so in words (and says when each was last heard), and it
 * lights by itself when the hardware returns.
 *
 * WHY IT IS DYNAMIC. peekNow() is a snapshot of this moment: it reads the
 * minute-old pulse file and the instruments' own stores. Every other page that
 * calls it (home, /bench, /ai-pilot) renders per request for the same reason;
 * a cached copy would print an hour-old verdict until the first poll replaced
 * it. peekNow() never waits on the network and never throws, and the two JSON
 * files read here are small, so the render stays cheap.
 */

export const dynamic = "force-dynamic"

export default async function AboutPage() {
  const now = await peekNow()
  const pilot = loadPilotData()

  // "First role": the resume's earliest role, by its start year. Printed with
  // the company so it reads as where the career began, beside the lede's
  // "15+ years", which counts the big-data work and not the career.
  const firstRole = [...ROLES, ...EARLIER_ROLES]
    .map((r) => ({ company: r.company, year: Number(r.years.slice(0, 4)) }))
    .filter((r) => Number.isFinite(r.year))
    .reduce((a, b) => (b.year < a.year ? b : a))
  const firstYear = firstRole.year
  // "PipeLive, LLC" reads as a letterhead in a two-word fact; the name is enough.
  const firstCompany = firstRole.company.replace(/,\s*(LLC|Inc\.?)$/, "")

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">About</span>
          </span>
        </nav>
        <h1>{TITLE}</h1>
      </div>

      <p className="lede">{LEDE}</p>

      {/* ---- The story, with the one picture beside it ------------------- */}
      <div className="beta-about-story">
        <div className="prose beta-about-story__text">
          <h2>Philosophy</h2>
          {PHILOSOPHY.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <p>
            {STILL_TRUE.map((part) =>
              part.href ? (
                <Link href={part.href} key={part.text}>
                  {part.text}
                </Link>
              ) : (
                <span key={part.text}>{part.text}</span>
              ),
            )}
          </p>
        </div>

        <aside className="beta-about-aside" aria-label="At a glance">
          <figure className="beta-about-fig">
            <Link href="/meatball" aria-label="Meatball, the home server with senses">
              {/* A plain <img>: a 142 KB transparent PNG, drawn straight onto
                  the paper. Intrinsic size given so it reserves its room. */}
              <img
                src="/meatball-mascot.png"
                width={512}
                height={279}
                alt="A cartoon meatball made of wires, vacuum tubes and circuit boards, smiling and waving both gloved hands."
                loading="lazy"
              />
            </Link>
            <figcaption>
              Meatball, as drawn. The real one has no case and sits open on a bench.
            </figcaption>
          </figure>

          <dl className="kv beta-about-facts">
            <div>
              <dt>Based</dt>
              <dd>Grand Rapids, Michigan</dd>
            </div>
            <div>
              <dt>First role</dt>
              <dd>
                {firstCompany}, {firstYear}
              </dd>
            </div>
            <div>
              <dt>Resume dated</dt>
              <dd>{RESUME_UPDATED}</dd>
            </div>
          </dl>
          <p className="beta-about-aside__links">
            <Link className="btn" href="/resume">
              Read the resume
            </Link>
            <a className="btn btn-ghost" href={RESUME_PDF}>
              PDF
            </a>
          </p>
        </aside>
      </div>

      {/* ---- Now ---------------------------------------------------------- */}
      <div className="prose beta-sec">
        <h2>What I am building this year</h2>
      </div>

      <div className="piece-grid beta-about-now">
        {NOW.map((card) => (
          <div className="rail" key={card.id}>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            {card.id === "site" ? <SiteRows initial={now} /> : null}
            {card.rows ? (
              <ul className="beta-about-rows beta-about-rows--plain">
                {card.rows.map((r) => (
                  <li key={r.href}>
                    <span className="beta-about-rows__text">
                      <Link href={r.href}>{r.name}</Link>
                      <span className="beta-about-rows__state">{r.line}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {card.note ? <p className="beta-about-credit">{card.note}</p> : null}
            <p className="piece-links">
              {card.links.map((l) =>
                l.external ? (
                  <a
                    className="btn"
                    href={l.href}
                    key={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link className="btn" href={l.href} key={l.href}>
                    {l.label}
                  </Link>
                ),
              )}
            </p>
          </div>
        ))}
      </div>

      {/* ---- The career --------------------------------------------------- */}
      <div className="prose beta-sec">
        <h2>Where the time went</h2>
        <p>Every role since {firstYear} on one axis, then six of them in a line each.</p>
      </div>

      <Career />

      {/* ---- Skills ------------------------------------------------------- */}
      <div className="prose beta-sec">
        <h2>What I work in</h2>
      </div>

      <div className="prose">
        <p>{SKILLS_LINE}</p>
      </div>
      <ReadMore label="The full list">
        <dl className="beta-about-skills">
          {SKILLS.map((s) => (
            <div key={s.group}>
              <dt>{s.group}</dt>
              <dd>{s.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </ReadMore>

      {/* ---- Writing: one line; /meatball lists the three notes --------- */}
      <div className="prose beta-sec">
        <h2>Writing</h2>
        <p>
          Three field notes from building Meatball, each written up as it happened, with the numbers
          from the run that produced them. They are on{" "}
          <Link href="/meatball#notes">the Meatball page</Link>.
        </p>
      </div>

      {/* ---- How this site is built, and its receipts --------------------- */}
      <Built
        pilot={pilot}
        initial={now}
        receipts={
          <>
            <div className="beta-about-chip">
              <BetaMeasured source="ai-pilot-data.json">
                Sessions and models in the text: <b>ai-pilot-data.json</b>, generated{" "}
                {longDate(pilot.generated) ?? "on an unrecorded date"}. The run number is this
                build&apos;s version.
              </BetaMeasured>
            </div>
          </>
        }
      />

      <p className="beta-resume-hire beta-about-hire">
        <span>
          <b>Open to full-time roles</b> in AI systems and data architecture.
        </span>
      </p>
      <Actions>
        <Link className="btn btn-primary" href="/resume">
          Read the resume
        </Link>
        <Link className="btn btn-ghost" href="/contact">
          Start a conversation
        </Link>
        <Link className="btn btn-ghost" href="/work">
          See the commit record
        </Link>
      </Actions>
    </div>
  )
}
