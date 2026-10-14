// Scenes 7 to 10 (issue #9): the record, the craft, how a job runs, the ask. Short, and mostly ports.
import { onLink } from "@tinymachines/kit/lib/router";
import { Builder, Cap, Chip } from "../components/bits";
import { useData, type Record } from "../data";
import { FAMILY } from "../../../components/kit/family-data";

const MAIN = "https://bradley.io";
const nf = (n: number | null | undefined) => (n === null || n === undefined ? "…" : n.toLocaleString("en-US"));

/** Commits a month, all four orgs summed: one bar each, no axis (the row above carries the numbers). */
function Months({ months }: { months: Record["months"] }) {
  const W = 640, H = 120, gap = 3, n = months.length, bw = (W - gap * (n - 1)) / n, max = Math.max(1, ...months.map((m) => m.commits));
  const total = months.reduce((s, m) => s + m.commits, 0);
  return (
    <figure className="bio-months">
      <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`Commits a month across the four organisations, ${months[0]?.month} to ${months.at(-1)?.month}: ${total.toLocaleString("en-US")} in all`}>
        {months.map((m, i) => {
          const h = Math.max(2, (m.commits / max) * H);
          return <rect key={m.month} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx="2" fill="var(--brand)"><title>{`${m.month}: ${m.commits.toLocaleString("en-US")}`}</title></rect>;
        })}
        <text x="0" y={H + 15} fill="var(--mute)" style={{ font: "12px var(--sans)" }}>{months[0]?.month}</text>
        <text x={W} y={H + 15} textAnchor="end" fill="var(--mute)" style={{ font: "12px var(--sans)" }}>{months.at(-1)?.month}</text>
      </svg>
      <figcaption className="note">Commits a month in the four organisations, every author, from each org&rsquo;s first commit under my name.</figcaption>
    </figure>
  );
}

export function S7Record({ record }: { record: Record | null }) {
  const r = record;
  return (
    <section className="bio-scene" id="record" aria-labelledby="record-h">
      <h2 id="record-h">The record.</h2>
      <Cap beginner={<>Counted, not described.</>} builder={<>Counted, not described: read from the git history and the Claude Code session logs, never typed.</>} />
      <div className="bio-four">
        <div className="stat"><p className="k">Commits under my name</p><p className="v">{nf(r?.ownCommits)}</p></div>
        <div className="stat"><p className="k">Repositories</p><p className="v">{nf(r?.repos)}</p></div>
        <div className="stat"><p className="k">Claude Code sessions</p><p className="v">{nf(r?.sessions)}</p></div>
        <div className="stat"><p className="k">Current streak</p><p className="v">{nf(r?.streak)}<small>days</small></p></div>
      </div>
      {r ? <Months months={r.months} /> : null}
      <Chip from={`git history of ${r?.orgCount ?? 4} orgs, author audit ${r?.auditedOn ?? ""}; sessions since ${r?.sessionsSince ?? "2026-03-08"} from the activity database`} at={r?.siteDataAt ?? undefined} href={`${MAIN}/work`} />
      <p>The full detail is on <a href={`${MAIN}/work`}>the main site&rsquo;s Work page</a>.</p>
    </section>
  );
}

/** public/family/marks.json (scripts/data.sh): the one-colour mark of each site that has one, by hue. */
type Marks = { [hue: string]: { name: string; file: string; from: string } };

/** A site as its mark in its own colour (the one-colour SVG used as a mask), or its dot when it has no mark yet. */
function Mark({ file, hex, name }: { file?: string; hex: string; name: string }) {
  return file
    ? <span className="bio-mark" role="img" aria-label={`${name} mark`} style={{ background: hex, WebkitMaskImage: `url(${file})`, maskImage: `url(${file})` }} />
    : <i style={{ background: hex }} aria-hidden="true" />;
}

export function S8Craft() {
  const sites = FAMILY.filter((f) => f.name);
  const marks = useData<Marks>("/family/marks.json");
  return (
    <section className="bio-scene" id="craft" aria-labelledby="craft-h">
      <h2 id="craft-h">The craft.</h2>
      <ul className="bio-shelf" aria-label="Meatball Labs and family">
        {sites.map((f) => (
          <li key={f.hue}>
            <Mark file={marks?.[f.hue]?.file} hex={f.hex} name={f.name ?? f.hue} />
            {f.href && !f.reserved ? <a href={f.href}>{f.name}</a> : <span>{f.name}</span>}
            <Builder><small>{f.hue}</small></Builder>
          </li>
        ))}
      </ul>
      <p className="bio-lead">Design and copy are part of delivery, not an upsell. Every site above wears its own mark and colour from one family guide (the marks are the brand library's, from meatball-labs), at <a href="https://meatball.ai/family/">meatball.ai</a>, <a href="https://meatball.ai/#boneyard">and twelve experiments retired on purpose</a>.</p>
    </section>
  );
}

const STEPS = [
  { n: "Survey", t: "Ask the annoying questions first: volumes, vendors, exceptions, and the pain nobody wrote down." },
  { n: "Heat", t: "Gather real data with as little friction as possible. No six-week discovery theatre." },
  { n: "Hammer", t: "Assemble the job from parts that already work, plugged into the systems you already use." },
  { n: "Temper", t: "Turn automation up gradually, as the system earns confidence on your real cases." },
  { n: "Inspect", t: "Watch it run. Every run leaves a receipt. Anything uncertain goes to a person." },
];

export function S9Process() {
  return (
    <section className="bio-scene" id="process" aria-labelledby="process-h">
      <h2 id="process-h">How a job runs.</h2>
      <svg className="bio-steps" viewBox="0 0 640 70" role="img" aria-label="Survey, Heat, Hammer, Temper, Inspect: five steps, always in this order">
        {STEPS.map((s, i) => (
          <g key={s.n}>
            {i ? <path d={`M${i * 128 - 22} 30 L${i * 128 - 6} 30`} stroke="var(--line)" strokeWidth="2" /> : null}
            <circle cx={i * 128 + 18} cy="30" r="16" fill={i === 3 ? "var(--brand)" : "var(--sheet)"} stroke="var(--ink)" strokeWidth="2" />
            <text x={i * 128 + 18} y="35" textAnchor="middle" fill={i === 3 ? "var(--sheet)" : "var(--ink)"} style={{ font: "700 14px var(--sans)" }}>{i + 1}</text>
            <text x={i * 128 + 40} y="35" fill="var(--ink)" style={{ font: "600 15px var(--sans)" }}>{s.n}</text>
          </g>
        ))}
      </svg>
      <ol className="bio-steplist">{STEPS.map((s) => <li key={s.n}><b>{s.n}</b> {s.t}</li>)}</ol>
      <p className="bio-lead">The tempering chart, in one sentence: automation is turned up only as it earns trust, from suggesting, to drafting for sign-off, to acting with review, and only then on its own.</p>
      <p className="bio-offer"><b>Trade rates, no surprise bills.</b></p>
      <p className="note">From <a href="https://sysforge.ai/#process">sysforge.ai</a>.</p>
    </section>
  );
}

export function S10Ask() {
  return (
    <section className="bio-scene" id="ask" aria-labelledby="ask-h">
      <h2 id="ask-h">Start a conversation.</h2>
      <p className="bio-lead">Write to <a href="mailto:brad@bradley.io">brad@bradley.io</a>. Three things make a first email easy to answer: what the job is, what systems it touches, and when you need it.</p>
      <p className="controls">
        <a className="btn" href="/contact" onClick={onLink}>How to reach me</a>
        <a className="btn quiet" href={`${MAIN}/resume`}>The resume</a>
      </p>
    </section>
  );
}

/** The family strip, as on the main site's footer: one dot a site, in its own colour. */
export function FamilyStrip() {
  return (
    <nav className="bio-family" aria-label="Meatball Labs and family">
      {FAMILY.map((f) => f.href && !f.reserved
        ? <a key={f.hue} href={f.href} title={f.name} style={{ background: f.hex }}><span className="sr">{f.name}</span></a>
        : <i key={f.hue} title={f.name ?? "an open hue"} style={{ background: f.hex }} />)}
    </nav>
  );
}
