// Scene 3, the two-day builds (issue #5). The three were named by Bradley on 14 Oct 2026: Save VI, House Calls and
// State of Race.
//
// House Calls, measured from this repository (app/housecalls/tools) and isenbek/housecalls-harness: the four free
// trades tools (quote, change order, photo stamper, materials list) were committed and deployed on 6 and 7 Sep 2026
// (19 and 4 commits under app/housecalls on those days); the local engine (housecalls-harness, Rust + DuckDB, seed
// phrase and vault) began on 6 Sep. Live at bradley.io/housecalls/tools; free, no account.
//
// State of Race is Nominate-AI/cbnight, "Election Night" (confirmed by Bradley on issue #5, 14 Oct 2026): the live
// board, headline races, the full ballot, race tracker, kiosk. Its CLAUDE.md: spawned 2026-08-17
// and "As of 2026-08-18 this is a LIVE election night ... Five physical screens are on boards driven by this vertical
// right now" (Florida's primary). Git: 15 commits on 17 Aug, 38 on 18 Aug, 407 to 13 Oct.
//
// Save VI, measured from its repository (Nominate-AI/cbsvi, ~/projects/nominate/cbsvi) on 14 Oct 2026. Its CLAUDE.md:
// "USVI voter-contact campaign (client: saveVI.com). A rep looks up voters, claims them, contacts them by text/call,
// and records the outcome; the campaign watches it roll up. Built 2026-08-26 from the scope call in docs/intake/; the
// whole slate (cbsvi#2 to #8) shipped that day." Git: first commit 2026-08-26, 20 commits that day and 17 the next,
// 552 commits over 42 active days to 13 Oct. The parts are the kinds of service that description names, reached over
// the mesh, and the shared app layer it vendors from cbapex/kit.
import { Cap, Chip } from "../components/bits";

interface Build { name: string; href?: string; brief: string; parts: string[]; shipped: string; who: string; start: string; days: string; source: string; at: string }

const BUILDS: Build[] = [
  {
    name: "Save VI", href: "https://svi.campaignbrain.dev",
    brief: "A voter-contact app for a US Virgin Islands campaign: a rep looks up voters, claims them, texts or calls, and records the outcome; the campaign watches it roll up.",
    parts: ["Sign-in and permissions", "Voter data", "Texting and calls", "Outcome records", "Daily report", "The UI kit"],
    shipped: "The whole first slate shipped the day it started; 552 commits since, live at svi.campaignbrain.dev.",
    who: "Save VI's campaign reps and staff (saveVI.com).",
    start: "2026-08-26", days: "the first slate shipped that day, 37 commits in its first two days",
    source: "the repository's git history (Nominate-AI/cbsvi)", at: "2026-10-14",
  },
  {
    name: "House Calls", href: "https://bradley.io/housecalls/tools",
    brief: "Free tools for the trades, on the phone in the truck: a quote, a change order, a photo stamped with time and place, and a materials list you can speak.",
    parts: ["The UI kit", "Local store (DuckDB)", "Rust engine", "Seed-phrase backup", "Share and print"],
    shipped: "Four tools live at bradley.io/housecalls/tools. The data stays on the phone; backup leaves only as ciphertext.",
    who: "Tradespeople, free, with no account and nothing reported anywhere.",
    start: "2026-09-06", days: "all four tools live by the next day",
    source: "bradley.io and isenbek/housecalls-harness git history", at: "2026-10-14",
  },
  {
    name: "State of Race", href: "https://night.campaignbrain.dev",
    brief: "The live election-night board: headline races as they report, the full ballot, a race tracker, and a kiosk mode for the screens in the room.",
    parts: ["Sign-in and permissions", "Results feeds", "Maps", "Charts", "Kiosk screens", "The UI kit"],
    shipped: "Started the day before Florida's primary; on election night it was driving five physical screens.",
    who: "A campaign's election-night desk and the screens on its walls.",
    start: "2026-08-17", days: "live on five screens the next night, 53 commits in its first two days",
    source: "the repository's git history (Nominate-AI/cbnight)", at: "2026-10-14",
  },
];

/** Parts on the left, the app on the right, drawn in the theme's tokens. */
function Strip({ parts, name }: { parts: string[]; name: string }) {
  const n = parts.length, H = Math.max(120, n * 18 + 12);
  return (
    <svg className="bio-strip" viewBox={`0 0 300 ${H}`} role="img" aria-label={`${n} parts feeding ${name}`}>
      {parts.map((p, i) => {
        const y = 10 + i * ((H - 20) / Math.max(1, n - 1 || 1));
        return (
          <g key={p}>
            <rect x="4" y={y - 6} width="12" height="12" rx="3" fill="var(--brand)" />
            <path d={`M18 ${y} C 120 ${y}, 150 ${H / 2}, 214 ${H / 2}`} fill="none" stroke="var(--line)" strokeWidth="1.5" />
          </g>
        );
      })}
      <rect x="214" y={H / 2 - 26} width="82" height="52" rx="8" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="2" />
      <text x="255" y={H / 2 + 5} textAnchor="middle" fill="var(--ink)" style={{ font: "600 13px var(--sans)" }}>{name}</text>
    </svg>
  );
}

export function S3TwoDays() {
  return (
    <section className="bio-scene" id="two-days" aria-labelledby="two-h">
      <h2 id="two-h">Two days.</h2>
      <Cap beginner={<>Built and delivered in about two working days each, from parts that already worked.</>}
           builder={<>Built and delivered with Sysforge and the UI, MCP and data kits, in about two working days each.</>} />
      <div className="bio-cards">
        {BUILDS.map((b) => (
          <article key={b.name} className="panel bio-build">
            <h3>{b.href ? <a href={b.href}>{b.name}</a> : b.name}</h3>
            <p>{b.brief}</p>
            <p className="bio-tags">{b.parts.map((p) => <span key={p} className="bio-tag">{p}</span>)}</p>
            <Strip parts={b.parts} name={b.name} />
            <dl className="bio-dl">
              <dt>Shipped</dt><dd>{b.shipped}</dd>
              <dt>Used by</dt><dd>{b.who}</dd>
              <dt>Started</dt><dd>{new Date(b.start + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}, {b.days}</dd>
            </dl>
            <Chip from={b.source} at={b.at} />
          </article>
        ))}
      </div>
    </section>
  );
}
