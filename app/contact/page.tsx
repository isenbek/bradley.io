import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { RESUME_PDF, RESUME_UPDATED } from "@/lib/resume"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Email brad@bradley.io. Grand Rapids, Michigan, Eastern time, roughly a day to reply on weekdays. NDAs welcome.",
}

/**
 * Contact: what a first conversation needs, and nothing the footer already says.
 *
 * The colophon under every page now carries the address and the GitHub links,
 * so the "Reach me" card that used to open this page was the same three links
 * twice on one screen. It is gone. What is here instead is what the previous
 * site had and the port dropped (git 4618109:app/contact/page.tsx), in the
 * owner's words: the four things that make a first email answerable, the
 * pointers to the rate sheet and the resume, and the closing call to action.
 *
 * The address is the page. It is set large, in mono, as the first thing under
 * the title, and it is a mailto with the subject the old button used ("hello
 * bradley") and an empty message. The one button, at the foot after the
 * advice, opens the same message with the four prompts already in it, so the
 * advice is not something to remember. It is the email, started. One address
 * and one button: the colophon under the page is the third way in, and that
 * is enough.
 *
 * Paper throughout. A person wrote all of it.
 */

const ADDRESS = "brad@bradley.io"

const POINTS = [
  {
    title: "What you’re building.",
    desc: "Two sentences is plenty. Skip the company pitch. Go straight to the system.",
    prompt: "What I am building:",
  },
  {
    title: "What hurts right now.",
    desc: "The specific failure, the slow query, the box that won’t talk. The reason you’re reaching out today and not last month.",
    prompt: "What hurts right now:",
  },
  {
    title: "What success looks like.",
    desc: "A metric, a date, an outcome: anything more concrete than “AI strategy.”",
    prompt: "What success looks like:",
  },
  {
    title: "Constraints if any.",
    desc: "On-prem only? Budget ceiling? Security clearance required? Tell me up front so neither of us wastes a call.",
    prompt: "Constraints, if any:",
  },
]

/**
 * The mail link. RFC 6068 wants CRLF line breaks, percent-encoded, and
 * encodeURIComponent gives exactly that. Built from POINTS so the email and
 * the list above it cannot drift apart.
 */
const MAILTO_PLAIN = `mailto:${ADDRESS}?subject=${encodeURIComponent("hello bradley")}`
const MAILTO =
  `${MAILTO_PLAIN}&body=${encodeURIComponent(POINTS.map((p) => `${p.prompt}\r\n\r\n`).join("\r\n"))}`

export default function BetaContactPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Contact</span>
          </span>
        </nav>
        <h1>Contact</h1>
      </div>

      <p className="beta-services-address">
        <a href={MAILTO_PLAIN}>{ADDRESS}</a>
      </p>

      <p className="lede">
        That is the whole contact form. Project, second opinion, weird hardware question, or just a
        hello. All welcome. Email is the front door; GitHub is the side door; both lead to the same
        room.
      </p>

      <div className="prose beta-sec">
        <h2>What helps a first email</h2>
        <p>
          None of this is required, but a paragraph hitting these four points means I can reply
          with something useful instead of a follow-up question.
        </p>
      </div>

      <div className="beta-services-first">
        <ol className="beta-services-points">
          {POINTS.map((p) => (
            <li key={p.title}>
              <div>
                <b>{p.title}</b>
                {p.desc}
              </div>
            </li>
          ))}
        </ol>

        <aside className="rail beta-services-facts" aria-label="Quick facts">
          <h3>Quick facts</h3>
          <dl className="kv">
            <div>
              <dt>Based</dt>
              <dd>Grand Rapids, MI</dd>
            </div>
            <div>
              <dt>Time zone</dt>
              <dd>Eastern</dd>
            </div>
            <div>
              <dt>Reply</dt>
              <dd>about a day, weekdays</dd>
            </div>
            <div>
              <dt>NDAs</dt>
              <dd>welcome</dd>
            </div>
          </dl>
          <p className="quiet">
            In-person friendly inside the Grand Rapids, Detroit and Chicago triangle.
          </p>
          <p className="quiet">Weekends are reserved for the lab, but I do peek.</p>
          <p className="quiet">
            Comfortable with classified-adjacent work, security review, and signed MNDAs.
          </p>
        </aside>
      </div>

      <div className="prose beta-sec">
        <h2>Before you write</h2>
      </div>

      {/* Three link cards: the kit's .rail and the site's shared .beta-linkcard
          for the look and the press. The anchor is the words at the foot and
          its ::after covers the card (.beta-services-to); the PDF link in the
          second card sits above that layer and keeps its own destination. */}
      <div className="beta-services-diffs beta-services-diffs--three">
        <article className="rail beta-linkcard beta-services-diff">
          <h3>Engagement shapes</h3>
          <p>
            Project, hourly, or retainer. Pricing and fit examples for each are on the services
            page, useful background if you&rsquo;re not sure which shape you need.
          </p>
          <span className="beta-linkcard__go">
            <Link className="beta-services-to" href="/services">
              See services
            </Link>
            <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
          </span>
        </article>

        <article className="rail beta-linkcard beta-services-diff">
          <h3>The resume</h3>
          <p>
            The full record since 1997, role by role. The PDF is the shorter cut: 2014 to the
            present.
          </p>
          <p className="beta-services-also">
            <a href={RESUME_PDF}>Download the PDF</a>{" "}
            <span className="quiet">revised {RESUME_UPDATED}</span>
          </p>
          <span className="beta-linkcard__go">
            <Link className="beta-services-to" href="/resume">
              Read the resume
            </Link>
            <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
          </span>
        </article>

        <article className="rail beta-linkcard beta-services-diff">
          <h3>Prefer chat?</h3>
          <p>
            Open a GitHub issue on any of my repos and tag @isenbek, totally fine for technical
            conversations.
          </p>
          <span className="beta-linkcard__go">
            <a
              className="beta-services-to"
              href="https://github.com/isenbek"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/isenbek
              <span className="sr-only"> (another site, opens in a new tab)</span>
            </a>
            <ArrowUpRight size={14} strokeWidth={2.2} aria-hidden="true" />
          </span>
        </article>
      </div>

      <div className="prose beta-sec">
        <h2>One paragraph. That&rsquo;s all I need.</h2>
        <p>
          Bring the problem. I&rsquo;ll bring the questions. Worst case you walk away with a clearer
          picture of what to do next. And that&rsquo;s free.
        </p>
      </div>

      <p className="beta-services-actions">
        <a className="btn btn-primary" href={MAILTO}>
          Write to {ADDRESS}
        </a>
        <span className="quiet">
          Opens your mail program with the four prompts above already in the message. Delete what
          does not apply.
        </span>
      </p>
    </div>
  )
}
