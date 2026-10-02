import Link from "next/link"
import {
  EARLIER_ROLES,
  EDUCATION,
  EXPERTISE,
  GOVERNMENT,
  HEADLINE,
  PROJECTS,
  RESUME_PDF,
  RESUME_UPDATED,
  ROLES,
  SUMMARY,
  type ResumeRole,
} from "@/lib/resume"

/**
 * The resume. Paper throughout: this is documentation about a person, not a
 * machine reporting on itself, so there is no panel on the page.
 *
 * Static. The content is lib/resume.ts and changes when that file does.
 */

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
        <ul>
          {role.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
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

      <p className="hero-ctas beta-cv-ctas">
        <a className="btn btn-primary" href={RESUME_PDF}>
          Download the PDF
        </a>
        <Link className="btn btn-ghost" href="/contact">
          Get in touch
        </Link>
      </p>

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
          payments, healthcare, and search. The current PDF leaves these out for length.
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

      <p className="quiet">
        Resume text last revised {RESUME_UPDATED}. The evidence behind it is on this site:{" "}
        <Link href="/work">the commit-level record</Link>,{" "}
        <Link href="/ai-pilot">the AI pilot log</Link>, and{" "}
        <Link href="/projects">the projects</Link>.
      </p>
    </div>
  )
}
