import {
  AVAILABILITY,
  AWARDS,
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
 * The resume as a US Letter sheet. public/resume.pdf is this page, printed by
 * scripts/build-resume-pdf.mjs, so the PDF and /resume read the same file
 * (lib/resume.ts) and cannot say different things. Edit the data, not this.
 *
 * Paper, like /resume: a resume is documentation about a person. The site's
 * chrome is hidden in print by the beta-cvp block in app/kit.css (the root
 * layout wraps every route in it and a nested route cannot opt out), and the
 * sheet carries its own name, contact line and closing line instead.
 *
 * The contact line is fixed here, not in the data, because it is what the
 * PDF needs and the page does not: no phone number, no salary, ever.
 */

const CONTACT: { label: string; href?: string }[] = [
  { label: "brad@bradley.io", href: "mailto:brad@bradley.io" },
  { label: "bradley.io", href: "https://bradley.io" },
  { label: "github.com/tinymachines", href: "https://github.com/tinymachines" },
  { label: "Grand Rapids, MI" },
]

/** A site-relative link in the data becomes an absolute one on paper. */
function absolute(href: string): string {
  return href.startsWith("/") ? `https://bradley.io${href}` : href
}

/**
 * A wrapping run of short items with a dot between them. Each item carries
 * the dot that follows it and does not break inside, so when a narrow screen
 * wraps the run, a line ends on a dot and never opens on one.
 */
function Run({ className, items }: { className: string; items: { label: string; href?: string }[] }) {
  return (
    <p className={`beta-cvp-run ${className}`}>
      {items.map((c, i) => (
        <span key={c.label}>
          {c.href ? <a href={absolute(c.href)}>{c.label}</a> : c.label}
          {i < items.length - 1 ? (
            <span className="beta-cvp-run__sep" aria-hidden="true">
              ·
            </span>
          ) : null}
        </span>
      ))}
    </p>
  )
}

function Role({ role }: { role: ResumeRole }) {
  return (
    <article className="beta-cvp-role">
      <header className="beta-cvp-role__head">
        <h3>
          {role.title}
          <span className="beta-cvp-role__co">{role.company}</span>
        </h3>
        <p className="beta-cvp-role__when">
          {role.location ? <span>{role.location}</span> : null}
          <span>{role.years}</span>
        </p>
      </header>
      {role.context ? <p className="beta-cvp-role__ctx">{role.context}</p> : null}
      {role.groups ? (
        role.groups.map((g) => (
          <div className="beta-cvp-group" key={g.label}>
            <h4 className="beta-cvp-group__label">{g.label}</h4>
            <ul>
              {g.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <ul>
          {role.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
      {role.links?.length ? <Run className="beta-cvp-role__links" items={role.links} /> : null}
      {role.tech ? <p className="beta-cvp-role__tech">{role.tech.join(" · ")}</p> : null}
    </article>
  )
}

/** One line per role: the earlier career is the record, not the detail. */
function EarlierRole({ role }: { role: ResumeRole }) {
  return (
    <li className="beta-cvp-early__row">
      <span className="beta-cvp-early__when">{role.years}</span>
      <span>
        <b>{role.title}</b>, {role.company}
        {role.location ? <span className="beta-cvp-early__where">, {role.location}</span> : null}
        {role.context ? <span className="beta-cvp-early__ctx">. {role.context}</span> : null}
      </span>
    </li>
  )
}

export default function ResumePrintPage() {
  const first = EARLIER_ROLES.at(-1)?.years.split(" ")[0]
  const last = EARLIER_ROLES[0]?.years.split(" ").at(-1)

  return (
    <article className="beta-cvp" aria-label="Resume of Bradley S. Isenbek, print layout">
      <p className="crumb beta-cvp-note">
        The print layout of <a href="/resume">/resume</a>. <a href={RESUME_PDF}>The PDF</a> is made from this page.
      </p>

      <header className="beta-cvp-head">
        <h1>Bradley S. Isenbek</h1>
        <p className="beta-cvp-head__line">{HEADLINE}</p>
        <Run className="beta-cvp-head__contact" items={CONTACT} />
        {AVAILABILITY.open ? (
          <p className="beta-cvp-head__open">
            <b>{AVAILABILITY.statement}</b> {AVAILABILITY.location}
          </p>
        ) : null}
      </header>

      <section className="beta-cvp-sec">
        <h2>Summary</h2>
        {SUMMARY.map((p) => (
          <p className="beta-cvp-prose" key={p}>
            {p}
          </p>
        ))}
      </section>

      <section className="beta-cvp-sec">
        <h2>Experience</h2>
        {ROLES.map((r) => (
          <Role role={r} key={`${r.company}-${r.years}`} />
        ))}
      </section>

      {EARLIER_ROLES.length ? (
        <section className="beta-cvp-sec">
          <h2>{first && last ? `Earlier career, ${first} to ${last}` : "Earlier career"}</h2>
          <ul className="beta-cvp-early">
            {EARLIER_ROLES.map((r) => (
              <EarlierRole role={r} key={`${r.company}-${r.years}`} />
            ))}
          </ul>
          {AWARDS.length ? (
            <p className="beta-cvp-awards">
              <b>Awards:</b>{" "}
              {AWARDS.map((a) => `${a.award} (${a.company}, ${a.years})`).join("; ")}.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="beta-cvp-sec">
        <h2>Government and classified work</h2>
        <ul className="beta-cvp-list">
          {GOVERNMENT.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section className="beta-cvp-sec">
        <h2>Open source and projects</h2>
        <ul className="beta-cvp-list beta-cvp-list--plain">
          {PROJECTS.map((p) => (
            <li key={p.name}>
              {p.href ? (
                <a href={absolute(p.href)}>
                  <b>{p.name}</b>
                </a>
              ) : (
                <b>{p.name}</b>
              )}
              {": "}
              {p.what}
            </li>
          ))}
        </ul>
      </section>

      <section className="beta-cvp-sec">
        <h2>Expertise</h2>
        <dl className="beta-cvp-skills">
          {EXPERTISE.map((e) => (
            <div key={e.area}>
              <dt>{e.area}</dt>
              <dd>{e.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="beta-cvp-sec">
        <h2>Education</h2>
        {/* One run of text, so it wraps like a sentence. The separator is
            glued to the item before it, so a wrapped line never opens on a dot. */}
        <p className="beta-cvp-edu">
          {EDUCATION.map((e, i) => (
            <span key={e.what}>
              <b>{e.what}</b>, {e.where}
              {i < EDUCATION.length - 1 ? " · " : null}
            </span>
          ))}
        </p>
      </section>

      <footer className="beta-cvp-foot">
        The current version is at <a href="https://bradley.io/resume">bradley.io/resume</a>. Updated {RESUME_UPDATED}.
      </footer>
    </article>
  )
}
