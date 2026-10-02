"use client"

import Link from "next/link"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { readSnapshot } from "@/components/live/use-live-now"
import type { NowId, NowRow, NowSnapshot, NowStatus } from "@/components/live/types"
import type { TermData, TermRole } from "./types"

/**
 * What each command prints.
 *
 * WHERE THE WORDS COME FROM. Nothing here is generated, and nothing is typed
 * in from memory:
 *
 *   about, skills, experience, education, resume
 *                 lib/resume.ts, through ./load.ts, verbatim
 *   stats         site-data.json `stats` and its own `coverage` note
 *   work, repos   app/work/_orgs.ts (the numbers /work draws)
 *   bench         the "Running instruments" group of app/_nav.ts
 *   now, ping     /api/now, asked when the command is typed
 *   uptime        lib/build-info.json
 *   contact       the address and the facts on /contact
 *   projects      PROJECT_GROUPS below: names and links from /projects, and
 *                 one line each. The lines for the 6502, Hotbits and Knock
 *                 knock are the ones /projects carries; TerraPulse, tinychase
 *                 and the NES say what their own sites say they are.
 *
 * The terminal used to print the pipeline's project list with its
 * descriptions. Many of those were written by a model about a directory name,
 * one still had an unfilled "[mention key technologies ...]" placeholder, and
 * the list includes things that are not public. It is not read here at all.
 *
 * Old words kept: "Type help to see available commands" and the banner are the
 * original terminal's (git show 63d43d0:app/terminal/page.tsx), as is
 * "Entering the matrix...". The `whoami` groups line is the previous site's
 * (git show 4618109:app/terminal/V3Terminal.tsx).
 *
 * COLOUR, inside the glass. The phosphor is the machine's own voice. Bright is
 * what somebody typed, and names worth reading. A dotted underline is a command
 * you can tap; a solid one is a link. The second colour (term__warn) is
 * ATTENTION and nothing else: [STALE], [OFFLINE], [NO REPLY], a request still
 * out. Do not use it for emphasis, or it stops meaning anything.
 */

// ---- The command table ------------------------------------------------------

export interface CommandInfo {
  name: string
  /** What follows the name in the help listing. */
  args?: string
  desc: string
  group: "Who" | "What" | "Live" | "Play" | "Shell"
  aliases?: string[]
  /** Values Tab offers for the first argument. */
  completes?: string[]
}

export const PING_NAMES: Record<NowId, string[]> = {
  activity: ["claude", "activity", "pilot"],
  firewall: ["knock", "visitors", "firewall"],
  geiger: ["hotbits", "geiger", "trng"],
  bus: ["bus", "worldevent", "dragonfli"],
  cameras: ["meatball", "eye", "cameras"],
  fleet: ["fleet"],
  sdr: ["sdr"],
  build: ["build"],
}

export const PHOSPHORS = ["blue", "green", "amber"] as const
export type Phosphor = (typeof PHOSPHORS)[number]

export const FILES = ["about.txt", "contact.txt", "resume.pdf", "README.md"]

export const COMMANDS: CommandInfo[] = [
  { name: "about", desc: "who this is, in two paragraphs", group: "Who" },
  {
    name: "experience",
    args: "[all]",
    desc: "the roles since 2014; all goes back to 1997",
    group: "Who",
    completes: ["all"],
  },
  { name: "skills", desc: "expertise, by area", group: "Who" },
  { name: "education", desc: "where I studied", group: "Who" },
  {
    name: "resume",
    args: "[pdf]",
    desc: "open the resume page, or the PDF",
    group: "Who",
    completes: ["pdf"],
  },
  { name: "contact", desc: "how to reach me", group: "Who" },

  { name: "projects", desc: "what is on the bench", group: "What" },
  {
    name: "work",
    desc: "four GitHub organisations, counted",
    group: "What",
    aliases: ["repos"],
  },
  { name: "stats", desc: "the site index, and the period it covers", group: "What" },

  { name: "now", desc: "every instrument, and whether it is answering", group: "Live" },
  {
    name: "ping",
    args: "<name>",
    desc: "ask after one instrument",
    group: "Live",
    completes: Object.values(PING_NAMES).map((n) => n[0]),
  },
  { name: "bench", desc: "the instrument pages", group: "Live" },
  { name: "uptime", desc: "the build that is answering you", group: "Live" },

  { name: "wopr", desc: "shall we play a game?", group: "Play", aliases: ["joshua"] },
  { name: "matrix", desc: "you know what this does", group: "Play" },
  {
    name: "theme",
    args: "<colour>",
    desc: "change the phosphor: blue, green, amber",
    group: "Play",
    completes: [...PHOSPHORS],
  },

  { name: "ls", desc: "list what is here", group: "Shell" },
  { name: "cat", args: "<file>", desc: "print a file", group: "Shell", completes: FILES },
  { name: "whoami", desc: "who am I?", group: "Shell" },
  { name: "github", desc: "open my GitHub profile", group: "Shell" },
  { name: "history", desc: "what you have typed", group: "Shell" },
  { name: "clear", desc: "clear the screen", group: "Shell" },
  { name: "help", desc: "this list", group: "Shell" },
]

/** Every word that runs something, for Tab. */
export const COMMAND_WORDS: string[] = COMMANDS.flatMap((c) => [c.name, ...(c.aliases ?? [])]).sort()

/** The canonical command for a typed word, or null. */
export function resolveCommand(word: string): CommandInfo | null {
  return COMMANDS.find((c) => c.name === word || c.aliases?.includes(word)) ?? null
}

// ---- Shared pieces ----------------------------------------------------------

/** Runs a command as if it had been typed. Provided by the terminal. */
export const RunContext = createContext<(command: string) => void>(() => {})

/** A command name the reader can tap instead of typing. */
export function Cmd({ c, children }: { c: string; children?: ReactNode }) {
  const run = useContext(RunContext)
  return (
    <button
      type="button"
      className="term__cmd"
      onClick={(e) => {
        e.stopPropagation()
        run(c)
      }}
    >
      {children ?? c}
    </button>
  )
}

function A({ href, children }: { href: string; children?: ReactNode }) {
  const text = children ?? href.replace(/^https?:\/\//, "").replace(/^mailto:/, "")
  if (href.startsWith("/") && !href.endsWith(".pdf")) {
    return (
      <Link className="term__a" href={href} prefetch={false}>
        {text}
      </Link>
    )
  }
  const external = href.startsWith("http")
  return (
    <a
      className="term__a"
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {text}
    </a>
  )
}

function H({ children }: { children: ReactNode }) {
  return <div className="term__h">{children}</div>
}

function Note({ children }: { children: ReactNode }) {
  return <div className="term__note">{children}</div>
}

const nf = new Intl.NumberFormat("en-US")

/** "2026-10-02 16:26 UTC" from any ISO stamp. Empty string if it will not parse. */
export function utcStamp(iso: string | null | undefined): string {
  if (!iso) return ""
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return ""
  return `${t.toISOString().slice(0, 16).replace("T", " ")} UTC`
}

function utcClock(ms: number): string {
  return `${new Date(ms).toISOString().slice(11, 19)} UTC`
}

function ageWords(ms: number): string {
  const min = Math.max(0, Math.floor(ms / 60_000))
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d > 0) return `${d} d ${h} h`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

// ---- Who --------------------------------------------------------------------

export function Help() {
  const groups: CommandInfo["group"][] = ["Who", "What", "Live", "Play", "Shell"]
  return (
    <div className="term__out">
      {groups.map((g) => (
        <div key={g} className="term__block">
          <H>{g}</H>
          <div className="term__rows term__rows--help">
            {COMMANDS.filter((c) => c.group === g).map((c) => (
              <div key={c.name} className="term__row">
                <div>
                  <Cmd c={c.name} />
                  {c.args ? <span className="term__mute"> {c.args}</span> : null}
                </div>
                <div className="term__mute">
                  {c.desc}
                  {c.aliases ? ` (also: ${c.aliases.join(", ")})` : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Note>Tap a command, or type it. Tab completes, the up arrow recalls.</Note>
    </div>
  )
}

export function About({ data }: { data: TermData }) {
  return (
    <div className="term__out">
      <div className="term__name">Bradley Isenbek</div>
      <div className="term__accent">{data.resume.headline}</div>
      <div className="term__mute">Grand Rapids, Michigan.</div>
      {data.resume.summary.map((p) => (
        <p key={p.slice(0, 24)} className="term__p">
          {p}
        </p>
      ))}
      <Note>
        Next: <Cmd c="experience" />, <Cmd c="skills" />, <Cmd c="projects" />, <Cmd c="resume" />,{" "}
        <Cmd c="contact" />.
      </Note>
    </div>
  )
}

export function Skills({ data }: { data: TermData }) {
  return (
    <div className="term__out">
      <H>Expertise</H>
      <div className="term__rows term__rows--wide">
        {data.resume.expertise.map((e) => (
          <div key={e.area} className="term__row">
            <div className="term__accent">{e.area}</div>
            <div className="term__mute">{e.items.join(", ")}</div>
          </div>
        ))}
      </div>
      <Note>
        From the resume, revised {data.resume.updated}. The whole of it: <Cmd c="resume" />.
      </Note>
    </div>
  )
}

function Roles({ roles }: { roles: TermRole[] }) {
  return (
    <div className="term__rows term__rows--years">
      {roles.map((r) => (
        <div key={`${r.years}-${r.company}`} className="term__row">
          <div className="term__accent">{r.years}</div>
          <div>
            <div>
              <span className="term__bright">{r.title}</span>
              <span className="term__mute"> at </span>
              <span className="term__accent">{r.company}</span>
              {r.location ? <span className="term__mute">, {r.location}</span> : null}
            </div>
            {r.context ? <div className="term__mute">{r.context}</div> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Experience({ data, all }: { data: TermData; all: boolean }) {
  return (
    <div className="term__out">
      <H>Experience</H>
      <Roles roles={data.resume.roles} />
      {all ? (
        <>
          <H>Earlier, 1997 to 2014</H>
          <Roles roles={data.resume.earlier} />
        </>
      ) : null}
      <Note>
        {all ? null : (
          <>
            <Cmd c="experience all" /> goes back to 1997.{" "}
          </>
        )}
        What each role involved is on <A href="/resume">/resume</A>.
      </Note>
    </div>
  )
}

export function Education({ data }: { data: TermData }) {
  return (
    <div className="term__out">
      <H>Education</H>
      <div className="term__rows term__rows--wide">
        {data.resume.education.map((e) => (
          <div key={e.where} className="term__row">
            <div className="term__accent">{e.where}</div>
            <div className="term__mute">{e.what}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Resume({ data, pdf }: { data: TermData; pdf: boolean }) {
  return (
    <div className="term__out">
      <div className="term__mute">
        {pdf ? "Opening the PDF in a new tab." : "Opening the resume page in a new tab."} If nothing
        opened, your browser stopped it; the links work either way.
      </div>
      <div className="term__rows">
        <div className="term__row">
          <div className="term__mute">page</div>
          <div>
            <A href="/resume">/resume</A>
            <span className="term__mute"> the full record since 1997</span>
          </div>
        </div>
        <div className="term__row">
          <div className="term__mute">pdf</div>
          <div>
            <A href={data.resume.pdf}>{data.resume.pdf}</A>
            <span className="term__mute"> revised {data.resume.updated}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Contact() {
  return (
    <div className="term__out">
      <H>Contact</H>
      <div className="term__rows term__rows--short">
        <div className="term__row">
          <div className="term__mute">email</div>
          <div>
            <A href="mailto:brad@bradley.io">brad@bradley.io</A>
          </div>
        </div>
        <div className="term__row">
          <div className="term__mute">github</div>
          <div>
            <A href="https://github.com/isenbek">github.com/isenbek</A>
          </div>
        </div>
        <div className="term__row">
          <div className="term__mute">lab</div>
          <div>
            <A href="https://github.com/tinymachines">github.com/tinymachines</A>
          </div>
        </div>
        <div className="term__row">
          <div className="term__mute">where</div>
          <div className="term__bright">Grand Rapids, MI. Eastern time.</div>
        </div>
        <div className="term__row">
          <div className="term__mute">reply</div>
          <div className="term__bright">about a day, weekdays</div>
        </div>
      </div>
      <Note>
        What helps a first email is on <A href="/contact">/contact</A>.
      </Note>
    </div>
  )
}

// ---- What -------------------------------------------------------------------

interface ProjectLine {
  name: string
  href: string
  line?: string
}

const PROJECT_GROUPS: { title: string; items: ProjectLine[] }[] = [
  {
    title: "Chips",
    items: [
      {
        name: "The 6502",
        href: "/6502",
        line: "A transistor-level simulation of the chip that made home computing affordable.",
      },
      {
        name: "The NES",
        href: "https://tinymachines.ai/nes",
        line: "A working console with both of its chips simulated switch by switch. The chip work lives at tinymachines.ai.",
      },
    ],
  },
  {
    title: "Platforms",
    items: [
      {
        name: "TerraPulse",
        href: "https://terrapulse.info",
        line: "A measured-data platform for climate and geophysical data, with a public read-only MCP server. I am its architect.",
      },
      {
        name: "tinychase",
        href: "https://tinychase.com",
        line: "Small models on measured public data, run in your browser. I engineered it.",
      },
    ],
  },
  {
    title: "Instruments on this server",
    items: [
      {
        name: "Hotbits",
        href: "/trng",
        line: "Random numbers from radioactive decay, tested continuously.",
      },
      {
        name: "Knock knock",
        href: "/visitors",
        line: "Everything that has tried the doors on this host, across every site it serves.",
      },
    ],
  },
  {
    title: "Math instruments, in the browser",
    items: [
      { name: "Prime Atlas", href: "/projects/prime-atlas" },
      { name: "Zeta Forge", href: "/projects/zeta-forge" },
      { name: "Prime Orchestra", href: "/projects/prime-orchestra" },
      { name: "Prime Zoo", href: "/projects/prime-zoo" },
      { name: "Storm Plates", href: "/projects/storm-plates" },
      { name: "Critical Collapse", href: "/projects/critical-collapse" },
    ],
  },
]

export function Projects() {
  return (
    <div className="term__out">
      {PROJECT_GROUPS.map((g) => (
        <div key={g.title} className="term__block">
          <H>{g.title}</H>
          {g.items.some((i) => i.line) ? (
            <div className="term__rows term__rows--wide">
              {g.items.map((i) => (
                <div key={i.href} className="term__row">
                  <div>
                    <A href={i.href}>{i.name}</A>
                  </div>
                  <div className="term__mute">{i.line}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="term__inline">
              {g.items.map((i) => (
                <A key={i.href} href={i.href}>
                  {i.name}
                </A>
              ))}
            </div>
          )}
        </div>
      ))}
      <Note>
        The rest of the instruments: <Cmd c="bench" />. Which are answering: <Cmd c="now" />. The full
        list with the detail: <A href="/projects">/projects</A>.
      </Note>
    </div>
  )
}

export function Work({ data }: { data: TermData }) {
  if (data.orgs.length === 0) {
    return (
      <div className="term__out term__mute">
        The org timelines could not be read. <A href="/work">/work</A> has the same data when it can.
      </div>
    )
  }
  const repos = data.orgs.reduce((s, o) => s + o.repos, 0)
  const commits = data.orgs.reduce((s, o) => s + o.commits, 0)
  return (
    <div className="term__out">
      <H>Four GitHub organisations</H>
      <div className="term__orgs">
        {data.orgs.map((o) => (
          <div key={o.slug} className="term__org">
            <div className="term__org-head">
              <span className="term__bright">
                {o.gh ? <A href={o.gh}>{o.name}</A> : o.name}
              </span>
              <span className="term__bright">
                {nf.format(o.repos)} {o.repos === 1 ? "repo" : "repos"}
              </span>
              <span className="term__bright">{nf.format(o.commits)} commits</span>
              <span className="term__mute">since {o.since}</span>
            </div>
            <div className="term__mute">{o.what}</div>
          </div>
        ))}
      </div>
      <div className="term__bright">
        total: {nf.format(repos)} repositories, {nf.format(commits)} commits
      </div>
      {data.orgs.length < data.orgsExpected ? (
        <div className="term__warn">
          [incomplete] {data.orgs.length} of {data.orgsExpected} timelines loaded, so the total is
          short.
        </div>
      ) : null}
      <Note>
        Counted from the commit log{data.orgsGenerated ? `, as of ${utcStamp(data.orgsGenerated)}` : ""}.
        A commit count is every commit in the org since my first one there, and not all of them are
        mine: <A href="/work#counting">how this is counted</A>. The charts are on{" "}
        <A href="/work">/work</A>.
      </Note>
    </div>
  )
}

export function Stats({ data }: { data: TermData }) {
  const s = data.stats
  if (!s) {
    return <div className="term__out term__mute">site-data.json could not be read, so there are no numbers to print.</div>
  }
  const cov = s.coverage
  const rows: [string, string][] = [
    ["Claude Code sessions", nf.format(s.totalSessions)],
    ["Transcript records", nf.format(s.totalMessages)],
    ["Active days", nf.format(s.activeDays)],
    ["Current streak", `${nf.format(s.streak)} d`],
  ]
  return (
    <div className="term__out">
      <H>Site index{cov?.stale ? " [stale]" : ""}</H>
      <div className="term__rows term__rows--num">
        {rows.map(([k, v]) => (
          <div key={k} className="term__row">
            <div className="term__mute">{k}</div>
            <div className="term__bright term__num">{v}</div>
          </div>
        ))}
      </div>
      <Note>
        {cov?.stale && cov.staleReason ? `${cov.staleReason} ` : null}
        {cov?.since && cov.through
          ? `Sessions, records, days and the streak cover ${cov.since} through ${cov.through} (UTC days).`
          : "This data file does not record what period its totals cover."}
        {cov?.recordingBegan
          ? ` The record began on ${cov.recordingBegan} and earlier months are incomplete.`
          : null}{" "}
        A transcript record is one line of a session log (a prompt, a tool result, a block of a
        reply), not a message somebody typed.
        {data.statsGenerated
          ? ` Source: site-data.json, written ${utcStamp(data.statsGenerated)}, regenerated every 4 hours.`
          : null}
      </Note>
    </div>
  )
}

// ---- Live -------------------------------------------------------------------

const STATUS_WORD: Record<NowStatus, string> = {
  live: "LIVE",
  stale: "STALE",
  offline: "OFFLINE",
  checking: "CHECKING",
}

/**
 * How old an answer was when it reached the browser, as far as can be told.
 *
 *   fresh    stamped within a minute of the browser's clock
 *   replay   the browser is offline, so the answer can only have come from the
 *            service worker's cache (public/sw.js falls back to it when the
 *            network fails)
 *   old      online, and stamped more than a minute before the browser's
 *            clock. That is either a cached replay or a clock that is wrong,
 *            and this page cannot tell which, so it says both.
 */
type Age = "fresh" | "replay" | "old"

type Asked =
  | { state: "asking" }
  | { state: "failed"; why: string }
  | { state: "answered"; snap: NowSnapshot; age: Age }

function ageOf(at: string): Age {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false
  if (offline) return "replay"
  return Date.now() - new Date(at).getTime() > 60_000 ? "old" : "fresh"
}

/**
 * Ask /api/now once, when the command is typed. No polling: a terminal prints
 * an answer and moves on, and the answer carries its own time.
 */
export function useNowOnce(): Asked {
  const [asked, setAsked] = useState<Asked>({ state: "asking" })

  useEffect(() => {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 8_000)
    fetch("/api/now", { cache: "no-store", signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((body: unknown) => {
        const snap = readSnapshot(body)
        if (!snap) {
          setAsked({ state: "failed", why: "the answer was not a snapshot" })
          return
        }
        setAsked({ state: "answered", snap, age: ageOf(snap.at) })
      })
      .catch((e: unknown) => {
        if (ctl.signal.aborted) {
          setAsked({ state: "failed", why: "no answer within 8 s" })
          return
        }
        setAsked({ state: "failed", why: e instanceof Error ? e.message : "the request failed" })
      })
      .finally(() => clearTimeout(timer))
    return () => {
      clearTimeout(timer)
      ctl.abort()
    }
  }, [])

  return asked
}

/** One sentence on when the answer was made, honest about what is not known. */
function whenSaid(snap: NowSnapshot, age: Age): string {
  const at = utcStamp(snap.at)
  if (age === "replay") {
    return `Your browser is offline, so this is the last answer it kept, assembled ${at}.`
  }
  if (age === "old") {
    return `This answer is stamped ${at}, more than a minute behind your device's clock: either your browser replayed a cached copy because the server did not answer, or the clock is off.`
  }
  return `Asked /api/now, answered ${at}.`
}

function Status({ status }: { status: NowStatus }) {
  const tone = status === "live" ? "term__ok" : status === "checking" ? "term__mute" : "term__warn"
  return <span className={tone}>[{STATUS_WORD[status]}]</span>
}

function reading(row: NowRow): string | null {
  if (row.value === null) return null
  return row.unit ? `${row.value} ${row.unit}` : row.value
}

function Asking() {
  return <div className="term__out term__mute">asking /api/now ...</div>
}

function NoAnswer({ why }: { why: string }) {
  return (
    <div className="term__out term__warn">
      /api/now did not answer ({why}). There is nothing to print, and I am not going to guess.
    </div>
  )
}

export function Now() {
  const asked = useNowOnce()
  if (asked.state === "asking") return <Asking />
  if (asked.state === "failed") return <NoAnswer why={asked.why} />

  const { snap, age } = asked
  const live = snap.rows.filter((r) => r.status === "live").length
  return (
    <div className="term__out">
      <H>Running now</H>
      <div className="term__now">
        {snap.rows.map((r) => {
          const value = reading(r)
          return (
            <div key={r.id} className="term__now-row">
              <div className="term__now-status">
                <Status status={r.status} />
              </div>
              <div className="term__now-label">
                {r.href ? <A href={r.href}>{r.label}</A> : <span className="term__bright">{r.label}</span>}
              </div>
              <div className="term__now-said">
                {value ? <div className="term__bright">{value}</div> : null}
                <div className="term__mute">{r.sentence}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="term__bright">
        {live} of {snap.rows.length} answering.
      </div>
      <Note>
        {whenSaid(snap, age)}{" "}
        Nothing here is simulated: an offline row is a box that is not answering. One at a time:{" "}
        <Cmd c="ping hotbits" />.
      </Note>
    </div>
  )
}

/**
 * What the terminal prints as it starts: the same question `now` asks, put to
 * /api/now once, and printed short, one status word per instrument. It is the
 * one thing a terminal on this site can honestly say at power-on that changes
 * from visit to visit. If /api/now does not answer, it says that instead.
 */
export function SelfTest() {
  const asked = useNowOnce()
  if (asked.state === "asking") {
    return <div className="term__mute">checking the instruments on this host ...</div>
  }
  if (asked.state === "failed") {
    return (
      <div className="term__warn">
        [NO ANSWER] /api/now did not answer ({asked.why}), so there is no instrument report.
      </div>
    )
  }
  const { snap, age } = asked
  const live = snap.rows.filter((r) => r.status === "live").length
  return (
    <div className="term__selftest">
      <div className="term__mute">
        instruments on this host{age === "fresh" ? `, asked ${utcStamp(snap.at).slice(11)}` : ""}:
      </div>
      <div className="term__post">
        {snap.rows.map((r) => (
          <div key={r.id} className="term__post-row">
            <Status status={r.status} /> <span className="term__bright">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="term__mute">
        <span className="term__bright">
          {live} of {snap.rows.length}
        </span>{" "}
        answering. <Cmd c="now" /> has their readings.
        {age !== "fresh" ? ` ${whenSaid(snap, age)}` : null}
      </div>
    </div>
  )
}

/** The instrument id a typed name means, or null. */
export function pingTarget(name: string): NowId | null {
  const n = name.toLowerCase()
  for (const [id, names] of Object.entries(PING_NAMES) as [NowId, string[]][]) {
    if (id === n || names.includes(n)) return id
  }
  return null
}

export function PingUsage({ unknown }: { unknown?: string }) {
  return (
    <div className="term__out">
      <div className="term__mute">
        {unknown ? `ping: ${unknown}: no instrument by that name. ` : "usage: ping <name>. "}
        Names:
      </div>
      <div className="term__inline">
        {Object.values(PING_NAMES).map((n) => (
          <Cmd key={n[0]} c={`ping ${n[0]}`}>
            {n[0]}
          </Cmd>
        ))}
      </div>
    </div>
  )
}

export function Ping({ id, typed }: { id: NowId; typed: string }) {
  const asked = useNowOnce()
  if (asked.state === "asking") {
    return <div className="term__out term__mute">PING {typed} ...</div>
  }
  if (asked.state === "failed") return <NoAnswer why={asked.why} />

  const row = asked.snap.rows.find((r) => r.id === id)
  if (!row) {
    return <div className="term__out term__warn">/api/now answered without a row for {typed}.</div>
  }
  const value = reading(row)
  const up = row.status === "live" || row.status === "stale"
  return (
    <div className="term__out">
      <div className="term__mute">
        PING {typed} ({row.label}
        {row.href ? `, ${row.href}` : ""}) through /api/now
      </div>
      <div>
        <span className={up ? "term__ok" : "term__warn"}>{up ? "reply" : "no reply"}</span>
        {value ? <span className="term__bright"> {value}</span> : null}
      </div>
      <div className="term__mute">{row.sentence}</div>
      <div>
        <span className="term__mute">--- {row.label}: </span>
        <Status status={row.status} />
        {row.lastHeard ? <span className="term__mute"> last heard {utcStamp(row.lastHeard)}</span> : null}
        {asked.age !== "fresh" ? <span className="term__warn"> [answer stamped {utcStamp(asked.snap.at)}]</span> : null}
      </div>
      {row.href ? (
        <Note>
          Its page: <A href={row.href}>{row.href}</A>
        </Note>
      ) : null}
    </div>
  )
}

export function Bench({ data }: { data: TermData }) {
  return (
    <div className="term__out">
      <H>The bench</H>
      <div className="term__rows term__rows--wide">
        {data.bench.map((l) => (
          <div key={l.href} className="term__row">
            <div>
              <A href={l.href}>{l.label}</A>
            </div>
            <div className="term__mute">{l.blurb}</div>
          </div>
        ))}
      </div>
      <Note>
        Most of these read real hardware, and hardware goes away. <Cmd c="now" /> says which are answering.
      </Note>
    </div>
  )
}

export function Uptime({ data, at }: { data: TermData; at: number }) {
  const built = new Date(data.build.built).getTime()
  const age = Number.isFinite(built) ? ageWords(at - built) : null
  return (
    <div className="term__out">
      <div className="term__bright">
        {utcClock(at)} up {age ?? "an unknown time"}, build {data.build.version}
      </div>
      <div className="term__rows">
        <div className="term__row">
          <div className="term__mute">version</div>
          <div className="term__bright">{data.build.version}</div>
        </div>
        <div className="term__row">
          <div className="term__mute">commit</div>
          <div>
            <A href={`https://github.com/isenbek/bradley.io/commit/${data.build.commitFull}`}>
              {data.build.commit}
            </A>
          </div>
        </div>
        <div className="term__row">
          <div className="term__mute">built</div>
          <div className="term__bright">{utcStamp(data.build.built)}</div>
        </div>
      </div>
      <Note>
        &ldquo;Up&rdquo; is the age of the build that served this page, read from its own build
        stamp. It is not the server&rsquo;s process uptime, which this page cannot see.
      </Note>
    </div>
  )
}

// ---- Shell ------------------------------------------------------------------

export function Ls() {
  return (
    <div className="term__out term__ls">
      {["experience/", "projects/", "skills/", "bench/"].map((d) => (
        <div key={d}>
          <span className="term__mute">drwxr-xr-x </span>
          <Cmd c={d.slice(0, -1)}>{d}</Cmd>
        </div>
      ))}
      {FILES.map((f) => (
        <div key={f}>
          <span className="term__mute">-rw-r--r-- </span>
          <Cmd c={`cat ${f}`}>{f}</Cmd>
        </div>
      ))}
    </div>
  )
}

export function Whoami() {
  return (
    <div className="term__out term__mute term__pre">
      <span className="term__accent">$</span> whoami{"\n"}
      bradley{"\n\n"}
      <span className="term__accent">$</span> groups{"\n"}
      data-engineers ai-pilots edge-hackers iot-builders frontier-technologists
    </div>
  )
}

export function History({ lines }: { lines: string[] }) {
  if (lines.length === 0) return <div className="term__out term__mute">nothing yet.</div>
  return (
    <div className="term__out term__rows term__rows--hist">
      {lines.map((l, i) => (
        // History is append-only, so the index is the identity.
        <div key={i} className="term__row">
          <div className="term__mute term__num">{i + 1}</div>
          <div>{l}</div>
        </div>
      ))}
    </div>
  )
}

export function NotFound({ word }: { word: string }) {
  return (
    <div className="term__out term__mute">
      command not found: <span className="term__bright">{word}</span>. Type <Cmd c="help" />.
    </div>
  )
}
