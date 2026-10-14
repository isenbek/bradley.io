// Scene 2, the claim in one interaction (issue #4): watch a job come together from parts that exist.
//
// The jobs, their parts and their receipts are COPIED from sysforge.ai's "Watch a job come together" section
// (~/projects/sysforge-site, site/index.html, the `JOBS` array in its last <script>, at commit c6e71e4). It is static
// data there, so it is static data here; change it there first, then copy. The behaviour is the same: pick a job, the
// parts light up in order, the approval gate is marked, the receipt prints last. Reduced motion shows it all at once.
import { useEffect, useRef, useState } from "react";
import { Cap, Stack } from "../components/bits";

interface Part { b: string; s: string; gate?: boolean }
const JOBS: { ask: string; parts: Part[]; receipt: string }[] = [
  { ask: "Remind hotel guests the day before they arrive.",
    parts: [
      { b: "Guest list", s: "Reads tomorrow's arrivals from the booking system." },
      { b: "Calendar", s: "Runs once a day, at 10 in the morning." },
      { b: "AI writer", s: "Drafts a friendly note with each guest's details." },
      { b: "Your approval", s: "You read the first batch and say yes.", gate: true },
      { b: "Text messages", s: "Sends them, and logs every reply." } ],
    receipt: "Receipt: 23 guests found, 23 notes drafted, approved by the front desk, 23 texts sent, 4 replies saved." },
  { ask: "File every invoice that lands in email.",
    parts: [
      { b: "Email inbox", s: "Watches the billing mailbox." },
      { b: "Document reader", s: "AI pulls out vendor, date and amount." },
      { b: "File storage", s: "Saves the PDF where accounting can find it." },
      { b: "Your approval", s: "Anything over a limit you set waits for you.", gate: true },
      { b: "The books", s: "Adds the entry to your accounting system." } ],
    receipt: "Receipt: 9 emails read, 7 invoices found, 6 filed on their own, 1 over the limit approved by the owner, 7 entries added." },
  { ask: "Put live election results on a big screen.",
    parts: [
      { b: "Results feeds", s: "Collects official counts as counties report." },
      { b: "Maps", s: "Colors each district as the numbers move." },
      { b: "Charts", s: "Turns the totals into a board people can read." },
      { b: "Your approval", s: "An editor checks the first board before it airs.", gate: true },
      { b: "Big screens", s: "Pushes updates to every screen in the room." } ],
    receipt: "Receipt: 83 counties reporting, board refreshed every 60 seconds, first board approved by the editor, 6 screens live." },
];

function JobBoard() {
  const [job, setJob] = useState(0);
  const [lit, setLit] = useState(0);         // parts lit so far; parts.length + 1 = receipt shown
  const [seen, setSeen] = useState(false);   // it animates once the reader has scrolled to it, never before
  const box = useRef<HTMLDivElement>(null);
  const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parts = JOBS[job].parts;

  useEffect(() => {
    const el = box.current;
    if (!el || !("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    if (still) { setLit(parts.length + 1); return; }
    setLit(0);
    const ts = parts.map((_, n) => setTimeout(() => setLit(n + 1), 250 + n * 550));
    ts.push(setTimeout(() => setLit(parts.length + 1), 250 + parts.length * 550 + 200));
    return () => ts.forEach(clearTimeout);
  }, [job, seen, still, parts]);

  return (
    <div className="panel bio-job" ref={box}>
      <div className="bio-job__goals" role="group" aria-label="Example jobs">
        {JOBS.map((j, i) => <button key={i} type="button" className="bio-job__goal" aria-pressed={i === job} onClick={() => setJob(i)}>{j.ask.replace(/\.$/, "")}</button>)}
      </div>
      <p className="bio-job__ask">&ldquo;<span>{JOBS[job].ask}</span>&rdquo;</p>
      <ol className="bio-job__chain">
        {parts.map((p, n) => (
          <li key={job + ":" + n} className={(p.gate ? "gate " : "") + (n < lit ? "on" : "")}>
            <b>{p.b}</b><small>{p.s}</small>
          </li>
        ))}
      </ol>
      <p className="bio-job__receipt" aria-live="polite">{lit > parts.length ? JOBS[job].receipt : ""}</p>
    </div>
  );
}

export function S2Claim() {
  return (
    <section className="bio-scene" id="claim" aria-labelledby="claim-h">
      <h2 id="claim-h">Most business software is the same parts, arranged differently.</h2>
      <p className="bio-lead">When you realize most business apps are boilerplate, the same parts in different arrangements with perhaps some critical code or data processing, you abstract, generalize, and make the modules speak a common language. Then a new app is mostly assembly.</p>
      <JobBoard />
      <Cap beginner={<>The parts are real: about 60 of them, 41 services running together at one site, counted from the code on 2 Oct 2026. See <a href="https://sysforge.ai/#floor">the shop floor</a>.</>}
           builder={<>The parts are real: about 60 of them, 41 services running together at one site, counted from the code on 2 Oct 2026, each a FastAPI service on one mesh with its own OpenAPI contract. See <a href="https://sysforge.ai/#floor">the shop floor</a>. The board above is an illustration of how a plan comes together, simplified for this page.</>} />
      <Stack tags={["FastAPI", "mesh registry", "OpenAPI contracts", "human approval gate"]} />
    </section>
  );
}
