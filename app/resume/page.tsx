import Link from "next/link"
import {
  AVAILABILITY,
  EARLIER_ROLES,
  EDUCATION,
  EXPERTISE,
  GOVERNMENT,
  HEADLINE,
  PROJECTS,
  RESUME_PDF,
  RESUME_UPDATED,
  ROLES,
  STRENGTHS,
  SUMMARY_BUILDS,
  SUMMARY_BUILDS_LEAD,
  SUMMARY_CLOSE,
  SUMMARY_INTRO,
  type ResumeRole,
} from "@/lib/resume"
import { Grid, PageHead, ReadMore, Section } from "@/components/page"

/**
 * The resume. Paper throughout: this is documentation about a person, not a
 * machine reporting on itself, so there is no panel on the page.
 *
 * Static. The content is lib/resume.ts and changes when that file does.
 *
 * The availability block sits right under the headline because it is the
 * reason most readers are here: what he is open to, where, and the three
 * ways onward (the PDF, a chat about this resume at /ask, and the contact
 * page). It carries no pay figure, by the owner's rule.
 *
 * THE /resume PASS (Brad, 2026-10-23), layout only: lib/resume.ts, the PDF
 * and /ask are untouched. Each role since 2014 shows its first three bullets
 * and folds the rest. The earlier roles are one line each, as the PDF gives
 * them, with the full text in one fold. Core strengths moved up under the
 * Summary. Folds are <details>: the text stays in the HTML and prints.
 */

/** Bullets a role shows before its fold. */
const SHOWN = 3

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href)
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  )
}

/**
 * A role's groups split at the SHOWN-th bullet: the first part is shown, the
 * rest folds. A group cut in two keeps its label on both sides.
 */
type Group = { label: string; bullets: string[] }
function splitGroups(groups: Group[], n: number): [Group[], Group[]] {
  const shown: Group[] = []
  const rest: Group[] = []
  let left = n
  for (const g of groups) {
    const take = Math.max(0, Math.min(left, g.bullets.length))
    if (take > 0) shown.push({ label: g.label, bullets: g.bullets.slice(0, take) })
    if (take < g.bullets.length) rest.push({ label: g.label, bullets: g.bullets.slice(take) })
    left -= take
  }
  return [shown, rest]
}

function Groups({ groups }: { groups: Group[] }) {
  return groups.map((g) => (
    <div className="beta-resume-group" key={g.label}>
      <h4>{g.label}</h4>
      <Bullets items={g.bullets} />
    </div>
  ))
}

function Role({ role, fold = false }: { role: ResumeRole; fold?: boolean }) {
  const [shownGroups, restGroups] = role.groups ? splitGroups(role.groups, fold ? SHOWN : Infinity) : [[], []]
  const shownBullets = fold ? role.bullets.slice(0, SHOWN) : role.bullets
  const restBullets = fold ? role.bullets.slice(SHOWN) : []
  const more = role.groups ? restGroups.reduce((n, g) => n + g.bullets.length, 0) : restBullets.length
  return (
    <article className="beta-cv-role">
      <p className="beta-cv-when">
        <span>{role.years}</span>
        {role.location ? <span>{role.location}</span> : null}
      </p>
      <div className="beta-cv-body">
        <h3>
          {role.title}
          <span>{role.company}</span>
        </h3>
        {role.context ? <p className="quiet">{role.context}</p> : null}
        {role.groups ? <Groups groups={shownGroups} /> : <Bullets items={shownBullets} />}
        {more > 0 ? (
          <ReadMore label={`More from this role (${more})`}>
            {role.groups ? <Groups groups={restGroups} /> : <Bullets items={restBullets} />}
          </ReadMore>
        ) : null}
        {role.links ? (
          <p className="beta-resume-links">
            {role.links.map((l) =>
              isExternal(l.href) ? (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ),
            )}
          </p>
        ) : null}
        {role.tech ? (
          <p className="chips">
            {role.tech.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </article>
  )
}

export default function ResumePage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Resume" }]}
        title="Bradley S. Isenbek"
        lede={
          <>
            {HEADLINE} Grand Rapids, Michigan.
          </>
        }
      />

      <section className="beta-resume-avail" aria-labelledby="resume-avail">
        <p className="beta-resume-avail__status" id="resume-avail">
          <span className="beta-resume-avail__mark" aria-hidden="true" />
          Open to roles
        </p>
        <p className="beta-resume-avail__line">
          <b>{AVAILABILITY.statement}</b> {AVAILABILITY.location}
        </p>
        <p className="beta-resume-avail__ctas">
          <a className="btn btn-primary" href={RESUME_PDF}>
            Download the PDF
          </a>
          <Link className="btn btn-ghost" href="/ask">
            Ask about this resume
          </Link>
          <Link className="btn btn-ghost" href={AVAILABILITY.contact}>
            Get in touch
          </Link>
        </p>
      </section>

      <Section title="Summary">
        <p>{SUMMARY_INTRO}</p>
        <p>{SUMMARY_BUILDS_LEAD}</p>
        <ul>
          {SUMMARY_BUILDS.map((b) => (
            <li key={b.name}>
              <b>{b.name}</b>: {b.text}
            </li>
          ))}
        </ul>
        <p>{SUMMARY_CLOSE}</p>

        <h2>Core strengths</h2>
      </Section>

      <Grid min="16rem" className="beta-resume-strengths">
        {STRENGTHS.map((s) => (
          <div className="rail" key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
          </div>
        ))}
      </Grid>

      <Section title="Experience" />

      <section className="beta-cv" aria-label="Experience, 2014 to the present">
        {ROLES.map((r) => (
          <Role role={r} fold key={`${r.company}-${r.years}`} />
        ))}
      </section>

      <Section title="Government and classified work">
        <ul>
          {GOVERNMENT.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>

        <h2>Expertise</h2>
      </Section>

      <div className="piece-grid">
        {EXPERTISE.map((e) => (
          <div className="rail" key={e.area}>
            <h3>{e.area}</h3>
            <p className="chips">
              {e.items.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <Section title="Earlier career">
        <p>
          Seventeen years before 2014, from co-founding a chat software company in 1997 through
          payments, healthcare, and search. One line each, as the PDF gives them.
        </p>
      </Section>

      <ol className="beta-cv-brief" aria-label="Earlier roles, 1997 to 2014">
        {EARLIER_ROLES.map((r) => (
          <li key={`${r.company}-${r.years}`}>
            <span className="beta-cv-brief__when">{r.years}</span>
            <span>
              <b>{r.title}</b>, {r.company}
            </span>
          </li>
        ))}
      </ol>

      <ReadMore label="Every earlier role in full">
        <section className="beta-cv" aria-label="Experience, 1997 to 2014">
          {EARLIER_ROLES.map((r) => (
            <Role role={r} key={`${r.company}-${r.years}`} />
          ))}
        </section>
      </ReadMore>

      <Section title="Open source and projects">
        <ul>
          {PROJECTS.map((p) => (
            <li key={p.name}>
              {p.href ? (
                p.internal ? (
                  <Link href={p.href}>{p.name}</Link>
                ) : (
                  <a href={p.href} target="_blank" rel="noopener noreferrer">
                    {p.name}
                  </a>
                )
              ) : (
                <b>{p.name}</b>
              )}
              {": "}
              {p.what}
            </li>
          ))}
        </ul>

        <h2>Education</h2>
        <ul>
          {EDUCATION.map((e) => (
            <li key={e.where}>
              {e.what}, {e.where}
            </li>
          ))}
        </ul>
      </Section>

      <section className="beta-resume-close" aria-label="Hiring">
        <p>
          <b>Hiring for AI systems or data architecture?</b> {AVAILABILITY.location}{" "}
          <Link href={AVAILABILITY.contact}>Get in touch</Link>, take{" "}
          <a href={RESUME_PDF}>the PDF</a>, or <Link href="/ask">ask the resume a question</Link>.
        </p>
      </section>

      <p className="quiet beta-resume-prov">
        Resume text last revised {RESUME_UPDATED}. The evidence behind it is on this site:{" "}
        <Link href="/ai-pilot">the AI pilot log</Link> and <Link href="/projects">the projects</Link>.
      </p>
    </div>
  )
}
