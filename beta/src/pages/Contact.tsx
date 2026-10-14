// /contact (scene 10, issue #9): the inbox, the three things that help a first email, and the resume for the hiring
// reader, second.
import { FamilyStrip } from "../scenes/S7to10";

export default function Contact() {
  return (
    <article className="bio-contact">
      <p className="kicker">bradley.io · <b>contact</b></p>
      <h1>Start a conversation</h1>
      <p className="lede">Write to <a href="mailto:brad@bradley.io">brad@bradley.io</a>.</p>
      <section className="panel bio-sec">
        <h2>Three things that help a first email</h2>
        <ol className="bio-three">
          <li><b>What the job is.</b> In your own words, the way you would tell a new hire.</li>
          <li><b>What systems it touches.</b> The software, spreadsheets and suppliers it has to work with.</li>
          <li><b>When you need it.</b> A date, or &ldquo;when it is right&rdquo;.</li>
        </ol>
        <p className="controls"><a className="btn" href="mailto:brad@bradley.io?subject=A%20project">Write an email</a></p>
      </section>
      <p className="bio-offer">Open for projects with local companies. On site across Grand Rapids and Kent County, remote everywhere else. Trade rates, no surprise bills.</p>
      <p>Hiring? <a href="https://bradley.io/resume">The resume</a> has the whole record since 1997.</p>
      <FamilyStrip />
    </article>
  );
}
