import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Email brad@bradley.io. Grand Rapids, Michigan, Eastern time, roughly a day to reply on weekdays. NDAs welcome.",
}

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

      <p className="lede">
        <a href="mailto:brad@bradley.io">brad@bradley.io</a>. That is the whole contact form.
      </p>

      <div className="piece-grid">
        <div className="rail">
          <h3>Reach me</h3>
          <dl className="kv">
            <div>
              <dt>Email</dt>
              <dd>
                <a href="mailto:brad@bradley.io">brad@bradley.io</a>
              </dd>
            </div>
            <div>
              <dt>GitHub</dt>
              <dd>
                <a href="https://github.com/isenbek" target="_blank" rel="noopener noreferrer">
                  @isenbek
                </a>
              </dd>
            </div>
            <div>
              <dt>Lab handle</dt>
              <dd>
                <a href="https://github.com/tinymachines" target="_blank" rel="noopener noreferrer">
                  @tinymachines
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rail">
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
            In person inside the Grand Rapids, Detroit and Chicago triangle. Comfortable with
            classified-adjacent work and security review.
          </p>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>What helps a first email</h2>
        <ul>
          <li>
            <strong>What you are building.</strong> Two sentences. Go straight to the system.
          </li>
          <li>
            <strong>What hurts right now.</strong> The specific failure, the slow query, the box
            that will not talk.
          </li>
          <li>
            <strong>What success looks like.</strong> A metric, a date, an outcome. Anything more
            concrete than &ldquo;AI strategy&rdquo;.
          </li>
        </ul>
        <p>
          Constraints too, if there are any: on-prem only, a budget ceiling, a clearance
          requirement. Up front, so neither of us spends a call finding out.
        </p>
      </div>
    </div>
  )
}
