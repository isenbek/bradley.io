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
  SUMMARY,
  type ResumeRole,
} from "@/lib/resume"

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
 */

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

function Role({ role }: { role: ResumeRole }) {
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
        {role.groups ? (
          role.groups.map((g) => (
            <div className="beta-resume-group" key={g.label}>
              <h4>{g.label}</h4>
              <Bullets items={g.bullets} />
            </div>
          ))
        ) : (
          <Bullets items={role.bullets} />
        )}
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
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Resume</span>
          </span>
        </nav>
        <h1>Bradley S. Isenbek</h1>
      </div>

      <p className="lede">{HEADLINE} Grand Rapids, Michigan.</p>

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

      <div className="prose beta-sec">
        <h2>Summary</h2>
        {SUMMARY.map((p) => (
          <p key={p}>{p}</p>
        ))}

        <h2>Experience</h2>
      </div>

      <section className="beta-cv" aria-label="Experience, 2014 to the present">
        {ROLES.map((r) => (
          <Role role={r} key={`${r.company}-${r.years}`} />
        ))}
      </section>

      <div className="prose beta-sec">
        <h2>Core strengths</h2>
      </div>

      <div className="beta-resume-strengths">
        {STRENGTHS.map((s) => (
          <div className="rail" key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
          </div>
        ))}
      </div>

      <div className="prose beta-sec">
        <h2>Government and classified work</h2>
        <ul>
          {GOVERNMENT.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>

        <h2>Expertise</h2>
      </div>

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

      <div className="prose beta-sec">
        <h2>Earlier career</h2>
        <p>
          Seventeen years before 2014, from co-founding a chat software company in 1997 through
          payments, healthcare, and search. The PDF gives each of these roles one line.
        </p>
      </div>

      <section className="beta-cv" aria-label="Experience, 1997 to 2014">
        {EARLIER_ROLES.map((r) => (
          <Role role={r} key={`${r.company}-${r.years}`} />
        ))}
      </section>

      <div className="prose beta-sec">
        <h2>Open source and projects</h2>
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
      </div>

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
