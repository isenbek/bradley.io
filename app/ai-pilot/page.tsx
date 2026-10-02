import Link from "next/link"
import type { ReactNode } from "react"
import {
  loadPilotData,
  loadToolUsage,
  publicMissions,
  publicSkills,
  tokens,
  coverageText,
  longDate,
  shortDate,
  daysInclusive,
  usd,
  COST_NOT_COMPUTED,
  LICENCE_CLASSES,
  TYPE_RATINGS,
} from "../_pilot-data"
import { BarStrip, RowChart } from "../_charts"
import { ActivityPulse } from "@/components/live/ActivityPulse"
import { peekNow } from "@/components/live/now-snapshot"
import { DayCalendar } from "@/components/pilot/DayCalendar"
import { FlightStatus } from "@/components/pilot/FlightStatus"
import { HourStrips } from "@/components/pilot/HourStrips"
import { ShareBar, type SharePart } from "@/components/pilot/ShareBar"
import { SpanRows, type SpanRow, type SpanTick } from "@/components/pilot/SpanRows"

/**
 * /ai-pilot: the licence, and the whole record behind it, on one page.
 *
 * This page holds everything /pilot-analytics used to (by project, by hour, by
 * day and week, what came up, the token totals), so that route now only
 * forwards here.
 *
 * THE ORDER. The licence first, as an object: a card of fixed proportion with
 * the record's index beside it, so a long page can be entered anywhere. Then
 * the logbook (the last 24 hours, every day, the hours of the day), the models,
 * the missions, the tools, the ratings, what came up and the tokens.
 *
 * WHAT IS LIVE. Two things, and both are true or absent: the "in flight" tag
 * in the licence's panel-bar (components/pilot/FlightStatus.tsx) and the
 * 24-hour pulse (components/live/ActivityPulse.tsx). They share one poll of
 * /api/now. The "now" mark on the hourly strips is the reader's clock. The
 * rest is the pipeline's file, read on each request.
 *
 * WHY IT IS DYNAMIC. peekNow() reads the minute-old pulse file, and a page
 * cached for an hour would open with an hour-old "now". Rendering costs one
 * 35 KB JSON read and no network: peekNow never waits on hardware.
 *
 * WHAT IS NOT HERE, ON PURPOSE.
 *   The raw Parquet export (app/api/pilot-analytics/download) is not linked:
 *   it carries every project directory name, git branch names, host names and
 *   session ids, and its token sums are per log line, two to three times the
 *   per-response figures printed here.
 *   Some mission rows are not printed by name, and five technology names are
 *   left out; app/_pilot-data.ts says which rule and why, and the page says so
 *   where it happens.
 *   Cost. The pipeline declines to total it and gives its reason, which is
 *   printed. Its dollar parts are not a total and are not shown.
 *
 * Metadata lives in ./layout.tsx.
 */

export const dynamic = "force-dynamic"

const nf = (n: number) => n.toLocaleString("en-US")

/** "132 tools, 342953 calls" to "132 tools, 342,953 calls": the pipeline's detail strings are unformatted. */
const groupDigits = (s: string) => s.replace(/\d{4,}/g, (m) => nf(Number(m)))

/** "28 May to 2 Oct", or one date when both ends are the same day. */
function spanText(a: string | undefined, b: string | undefined): string {
  const from = shortDate(a)
  const to = shortDate(b)
  if (!from || !to) return "dates not recorded"
  return from === to ? from : `${from} to ${to}`
}

/** A share in percent, never "0.0%" for something that is not nothing. */
function pctText(p: number): string {
  if (!(p > 0)) return "0%"
  if (p < 0.05) return "<0.1%"
  return `${p.toFixed(1)}%`
}

/**
 * Text with every ISO date held on one line. The pipeline's own sentences are
 * printed as written, and "2026-10-02" broken at a hyphen reads as two numbers.
 */
function keepDates(text: string): ReactNode[] {
  return text.split(/(\d{4}-\d{2}-\d{2})/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="beta-pilot-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

/**
 * The licence's machine-readable zone: the fields above it, again, in the
 * ICAO 9303 alphabet (capitals, digits and "<" as the filler), two lines of
 * 44. No check digits: nothing reads it, and a digit nobody can verify would
 * be decoration pretending to be a check.
 */
const MRZ_LEN = 44
const mrzField = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "<").replace(/^<+|<+$/g, "")
const mrzLine = (parts: string[]) => (parts.filter(Boolean).join("<<") + "<".repeat(MRZ_LEN)).slice(0, MRZ_LEN)
const yymmdd = (iso: string | undefined) => (/^\d{4}-\d{2}-\d{2}/.test(iso ?? "") ? `${iso!.slice(2, 4)}${iso!.slice(5, 7)}${iso!.slice(8, 10)}` : "")

const HOLDER = { given: "Bradley", family: "Isenbek" }

export default async function AiPilotPage() {
  const d = loadPilotData()
  const now = await peekNow()

  const { license: L, streaks: S, tokenEconomy: T } = d
  const since = d.coverage?.since ?? d.activityHeatmap[0]?.date ?? ""
  const through = d.coverage?.through ?? d.activityHeatmap.at(-1)?.date ?? ""
  const sinceLong = longDate(since)
  const throughLong = longDate(through)
  const generatedLong = longDate(d.generated)
  const periodDays = daysInclusive(since, through)
  const period = sinceLong && throughLong ? `${sinceLong} to ${throughLong}` : "period not recorded"
  const periodShort =
    shortDate(since) && shortDate(through)
      ? `${shortDate(since)} to ${shortDate(through)} ${through.slice(0, 4)}`
      : "period not recorded"
  const dayZone = S.timezone ?? d.coverage?.dayTimezone ?? null
  const hourZone = d.hourlyDistribution.timezone ?? "UTC"
  const began = d.coverage?.recordingBegan

  /* ---- The licence ------------------------------------------------------ */
  const klass = LICENCE_CLASSES.find((c) => c.name === L.class)
  const instrumentCount = Object.keys(d.instrumentRatings).length
  const endorsements = [
    klass?.long ?? L.class,
    L.modelCount > 1 ? `Multi-engine (${nf(L.modelCount)} models)` : null,
    instrumentCount > 0 ? `Instrument rated (${nf(instrumentCount)} ratings)` : null,
  ].filter(Boolean) as string[]

  const headline: { label: string; value: string; sub: string }[] = [
    { label: "Sessions", value: nf(L.totalSessions), sub: "flights logged" },
    { label: "Messages", value: nf(L.totalMessages), sub: "transcript records" },
    ...(typeof L.totalToolCalls === "number"
      ? [{ label: "Tool calls", value: nf(L.totalToolCalls), sub: "made by the model" }]
      : []),
    { label: "Projects", value: nf(L.projectCount), sub: "directories flown from" },
    { label: "Models flown", value: nf(L.modelCount), sub: "type ratings below" },
    {
      label: "Active days",
      value: nf(S.totalActiveDays),
      sub: periodDays ? `of ${nf(periodDays)} in the period` : "in the period",
    },
  ]

  const mrz = [
    mrzLine(["AIP", mrzField(HOLDER.family), mrzField(HOLDER.given)]),
    mrzLine([mrzField(L.number), mrzField(L.class), yymmdd(L.issued), yymmdd(through), mrzField(L.expires)]),
  ]

  /* ---- The shared day axis for the span charts -------------------------- */
  const axisDays = periodDays ?? 0
  const dayPos = (iso: string | undefined, end = false): number => {
    const n = daysInclusive(since, iso)
    if (!n || !axisDays) return 0
    return (end ? n : n - 1) / axisDays
  }
  const monthTicks: SpanTick[] = []
  if (axisDays) {
    const y0 = Number(since.slice(0, 4))
    const m0 = Number(since.slice(5, 7))
    for (let i = 1; i < 24; i++) {
      const first = new Date(Date.UTC(y0, m0 - 1 + i, 1)).toISOString().slice(0, 10)
      if (first > through) break
      monthTicks.push({ pos: dayPos(first), label: shortDate(first)?.split(" ")[1] ?? "" })
    }
  }

  /* ---- The days --------------------------------------------------------- */
  const days = d.activityHeatmap.map((a) => ({ date: a.date, value: a.count }))
  // When the current streak IS the longest one, two cells with the same number
  // say it once and look like a mistake. One cell, and the sub-line says so.
  const streakIsLongest =
    S.current === S.longest && (!S.longestEnd || !S.asOf || S.longestEnd === S.asOf)
  const streakCells: { label: string; value: string; sub: string }[] = [
    {
      label: streakIsLongest ? "Current streak, the longest" : "Current streak",
      value: `${nf(S.current)} days`,
      sub: streakIsLongest && S.longestStart
        ? `${spanText(S.longestStart, S.longestEnd ?? S.asOf)}, every day`
        : longDate(S.asOf)
          ? `as of ${longDate(S.asOf)}`
          : "as of the last run",
    },
    ...(streakIsLongest
      ? []
      : [
          {
            label: "Longest streak",
            value: `${nf(S.longest)} days`,
            sub: S.longestStart && S.longestEnd ? spanText(S.longestStart, S.longestEnd) : "dates not recorded",
          },
        ]),
    {
      label: "Busiest day",
      value: nf(S.peakDayCount),
      sub: `records on ${longDate(S.peakDay) ?? S.peakDay}`,
    },
    ...(S.peakWeek && typeof S.peakWeekCount === "number"
      ? [
          {
            label: "Busiest week",
            value: nf(S.peakWeekCount),
            sub: `records, week of ${longDate(S.peakWeek) ?? S.peakWeek}`,
          },
        ]
      : []),
  ]
  const splitOk = !!began && began > since && began <= through

  /* ---- Models ----------------------------------------------------------- */
  // Shares from the token counts themselves when the file has them: the file's
  // costShare is rounded to one place, and three models print 0.0 there that
  // wrote between 43 and 124,256 output tokens. "<0.1%" is the true figure.
  const outSum = d.typeRatings.reduce((s, m) => s + (m.outputTokens > 0 ? m.outputTokens : 0), 0)
  const modelShare = (m: (typeof d.typeRatings)[number]) =>
    outSum > 0 && m.outputTokens >= 0 ? (m.outputTokens / outSum) * 100 : m.costShare
  const topShare = Math.max(0, ...d.typeRatings.map(modelShare))
  const nameCount = new Map<string, number>()
  for (const m of d.typeRatings) nameCount.set(m.displayName, (nameCount.get(m.displayName) ?? 0) + 1)
  type PilotModel = (typeof d.typeRatings)[number]
  // The display name ("Opus 4.8"), unless two ids share it; then the id.
  const modelName = (m: PilotModel) =>
    m.displayName && nameCount.get(m.displayName) === 1 ? m.displayName : m.modelId.replace(/^claude-/, "")
  const modelRows: SpanRow[] = d.typeRatings.map((m) => ({
    key: m.modelId,
    label: modelName(m),
    sub: [
      m.proficiency,
      spanText(m.firstDay, m.lastDay),
      typeof m.apiCalls === "number" ? `${nf(m.apiCalls)} ${m.apiCalls === 1 ? "response" : "responses"}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    value: pctText(modelShare(m)),
    from: dayPos(m.firstDay),
    to: dayPos(m.lastDay, true),
    weight: topShare > 0 ? modelShare(m) / topShare : 0,
  }))
  const lead = d.typeRatings[0]
  const ratingRule = TYPE_RATINGS.filter((r) => r.above > 0)
    .map((r) => `${r.name} above ${r.above}%`)
    .join(", ")

  /* ---- Missions --------------------------------------------------------- */
  const { missions, withheld, grouped } = publicMissions(d)
  const topMessages = Math.max(0, ...missions.map((m) => m.messages))
  const missionRows: SpanRow[] = missions.map((m) => ({
    key: m.key,
    label: m.name ?? `cb*, ${nf(m.dirs)} directories`,
    sub: `${nf(m.sessions)} ${m.sessions === 1 ? "session" : "sessions"} · ${spanText(m.firstActive, m.lastActive)}`,
    value: nf(m.messages),
    from: dayPos(m.firstActive),
    to: dayPos(m.lastActive, true),
    weight: topMessages > 0 ? m.messages / topMessages : 0,
  }))
  const projectTotal = Math.max(L.projectCount, d.missionLog.length)

  /* ---- Tools ------------------------------------------------------------ */
  const tools = loadToolUsage(d)
  const SHARE_PARTS = 4
  const TAIL_ROWS = 8
  const share = (calls: number) => (tools && tools.total > 0 ? (calls / tools.total) * 100 : 0)
  const toolKinds = /^(\d+) tools/.exec(d.competencyRadar.find((c) => c.axis === "Tool Mastery")?.detail ?? "")?.[1]
  const headParts: SharePart[] =
    tools?.rows.slice(0, SHARE_PARTS).map((t) => ({
      label: t.tool,
      share: share(t.calls) / 100,
      display: pctText(share(t.calls)),
    })) ?? []
  const headShare = headParts.reduce((s, p) => s + p.share, 0)
  const restKinds = tools ? (toolKinds ? Number(toolKinds) : tools.rows.length) - headParts.length : 0
  const restPart: SharePart | undefined =
    tools && restKinds > 0
      ? {
          label: `${nf(restKinds)} other ${restKinds === 1 ? "tool" : "tools"}`,
          share: Math.max(0, 1 - headShare),
          display: pctText(Math.max(0, 1 - headShare) * 100),
        }
      : undefined
  const tailRows =
    tools?.rows.slice(SHARE_PARTS, SHARE_PARTS + TAIL_ROWS).map((t) => ({
      label: t.tool,
      value: t.calls,
      display: tools.exact ? nf(t.calls) : pctText(share(t.calls)),
    })) ?? []
  const toolOverPct =
    tools && !tools.exact && typeof L.totalToolCalls === "number" && L.totalToolCalls > 0
      ? (tools.total / L.totalToolCalls - 1) * 100
      : null
  const toolPeriod =
    tools?.from && tools?.to ? `${shortDate(tools.from)} to ${shortDate(tools.to)} ${tools.to.slice(0, 4)}` : null

  /* ---- Ratings ---------------------------------------------------------- */
  const instrumentRows: SpanRow[] = Object.entries(d.instrumentRatings)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([name, r]) => ({
      key: name,
      label: name,
      sub: `${nf(r.hits)} mentions · ${r.keywordCoverage.toFixed(0)}% of its keywords`,
      value: String(r.score),
      from: 0,
      to: r.score / 100,
      weight: r.score / 100,
    }))
  // The pipeline labels Bash + Grep + Read "debug tool calls". They are every
  // shell, search and read call, debugging or not; the page names what was
  // counted instead of what the formula assumes.
  const competencySub = (c: { axis: string; detail: string }) => {
    if (c.axis === "Debugging") {
      const n = /^(\d+)/.exec(c.detail)?.[1]
      if (n) return `${nf(Number(n))} Bash, Grep and Read calls`
    }
    return groupDigits(c.detail)
  }
  const competencyRows: SpanRow[] = [...d.competencyRadar]
    .sort((a, b) => b.score - a.score)
    .map((c) => ({
      key: c.axis,
      label: c.axis,
      sub: competencySub(c),
      value: String(c.score),
      from: 0,
      to: c.score / 100,
      weight: c.score / 100,
    }))
  const scoreTicks: SpanTick[] = [
    { pos: 0, label: "0" },
    { pos: 0.5, label: "50" },
    { pos: 1, label: "100" },
  ]
  const P = d.pilotingStyle
  const styleRows: SpanRow[] = [
    {
      key: "collaborative",
      label: "Collaborative",
      sub: `against ${P.directive}% directive`,
      value: `${P.collaborative}%`,
      from: 0,
      to: P.collaborative / 100,
      weight: P.collaborative / 100,
    },
    {
      key: "plan",
      label: "Plan first",
      sub: `against ${P.iterate}% iterate`,
      value: `${P.planFirst}%`,
      from: 0,
      to: P.planFirst / 100,
      weight: P.planFirst / 100,
    },
  ]
  const atCap = d.competencyRadar.filter((c) => c.score >= 95).length

  /* ---- What came up ----------------------------------------------------- */
  const { skills, dropped } = publicSkills(d)
  const SKILL_ROWS = 12
  const skillRows = skills
    .slice(0, SKILL_ROWS)
    .map((s) => ({ label: s.name, value: s.count, display: nf(s.count) }))
  const sampled = d.coverage?.rollingWindow?.filesSampled

  /* ---- Tokens ----------------------------------------------------------- */
  const cost = usd(T.totalCostUSD)
  const costReason = T.cost?.reason ?? "the session logs carry no cost field"
  const daily = T.dailyTokens
  const dailyPeak = daily.reduce((a, b) => (b.tokens > a.tokens ? b : a), daily[0])
  const dailyTicks = daily
    .map((t, i) => ({ at: i, label: shortDate(t.date) ?? "" }))
    .filter((_, i) => i % 7 === 0)
  const lastDailyIsRunDay = daily.at(-1)?.date === d.generated.slice(0, 10)
  const tokenRows: { label: string; n: number }[] = [
    { label: "Input", n: T.totalInputTokens },
    { label: "Output", n: T.totalOutputTokens },
    { label: "Cache read", n: T.totalCacheReadTokens },
    { label: "Cache created", n: T.totalCacheCreateTokens },
  ]

  /* ---- The index -------------------------------------------------------- */
  const index: { id: string; name: string; what: string }[] = [
    { id: "logbook", name: "Logbook", what: `${nf(S.totalActiveDays)} days, by day and hour` },
    { id: "models", name: "Models flown", what: `${nf(d.typeRatings.length)} type ratings` },
    { id: "missions", name: "Mission log", what: `the busiest ${nf(d.missionLog.length)} projects` },
    ...(tools ? [{ id: "tools", name: "Top tools", what: `${toolKinds ?? nf(tools.rows.length)} tools` }] : []),
    { id: "ratings", name: "Ratings", what: "instruments, competency, style" },
    { id: "came-up", name: "What came up", what: `${nf(skills.length)} technologies` },
    { id: "tokens", name: "Token economy", what: `${tokens(T.totalOutputTokens)} output tokens` },
  ]

  /**
   * The provenance chip: which keys of the file, what period, which run. The
   * period defaults to the whole record; a section drawn from the sampled logs
   * says so instead, because the whole-record dates would be a false claim.
   */
  const chip = (what: string, covering: string = periodShort) => (
    <p className="measured beta-pilot-chip">
      <span>
        <b>ai-pilot-data.json</b> {what}, {covering}
        {generatedLong ? `, generated ${generatedLong}` : ""}
      </span>
    </p>
  )

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">AI pilot</span>
          </span>
        </nav>
        <h1>AI pilot licence</h1>
      </div>

      <p className="lede">
        Every flight, on the record: the work I ship with Claude as co-pilot, counted from the
        session logs. None of it is self-assessed.
      </p>

      <p className="quiet beta-pilot-fine">
        {coverageText(d)} A message is one transcript record: a prompt, a tool result or one block
        of a model reply.
      </p>

      {/* ============================ THE LICENCE ========================== */}
      <div className="beta-pilot-top">
        <div className="beta-pilot-top__grid">
          <div className="beta-pilot-top__card">
            <div className="panel panel--polish beta-pilot-lic">
              <div className="panel-face">
                <div className="panel-bar beta-inst-bar">
                  <b>AI pilot licence</b>
                  <FlightStatus initial={now} />
                </div>

                <div className="beta-pilot-lic__doc">
                  <div className="beta-pilot-lic__id">
                    <p className="beta-pilot-lic__issuer">Federation of AI Aviation</p>
                    <p className="beta-pilot-lic__no">{L.number}</p>
                    <p className="beta-pilot-lic__holder">
                      {HOLDER.given} {HOLDER.family}
                    </p>
                    <p className="beta-pilot-lic__role">{endorsements.join(" · ")}</p>
                  </div>
                  <div className="beta-pilot-lic__class">
                    <span>Class</span>
                    <b>{L.class}</b>
                  </div>
                </div>

                <dl className="beta-pilot-cells beta-pilot-lic__fields">
                  <div>
                    <dt>Issued</dt>
                    <dd>{longDate(L.issued) ?? L.issued}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{L.expires}</dd>
                  </div>
                  <div>
                    <dt>Last entry</dt>
                    <dd>{throughLong ?? "not recorded"}</dd>
                  </div>
                </dl>

                <dl className="beta-pilot-cells beta-pilot-cells--big">
                  {headline.map((h) => (
                    <div key={h.label}>
                      <dt>{h.label}</dt>
                      <dd>{h.value}</dd>
                      <dd className="beta-pilot-cells__sub">{h.sub}</dd>
                    </div>
                  ))}
                </dl>

                <p className="beta-pilot-mrz" aria-hidden="true">
                  {mrz.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </div>
            </div>
            {chip("license and streaks")}
            <p className="quiet beta-pilot-fine">
              {klass && klass.above > 0
                ? `Class ${klass.name} is a volume band: more than ${nf(klass.above)} transcript records. `
                : ""}
              The serial is the session count, the issue date is the first day in the record, and
              the two lines at the foot repeat the card in machine-readable form. In flight means a
              Claude Code session on this host wrote to its log in the last five minutes; sessions
              on my second machine are not seen from here.
            </p>
          </div>

          <nav className="beta-pilot-index" aria-label="On this page">
            <p className="beta-pilot-index__h">In this record</p>
            <ol>
              {index.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <b>{s.name}</b>
                    <span>{s.what}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* ============================ LOGBOOK ============================== */}
      <div className="prose beta-sec">
        <h2 id="logbook">Logbook</h2>
        <p>
          The last 24 hours first, counted a minute at a time. Then the whole record: every day
          since {sinceLong ?? "the first entry"}, with each week&apos;s total over its column,
          and the hours of the day the work lands in.
        </p>
      </div>

      <div className="beta-pilot-stack">
        <ActivityPulse initial={now} />

        <div className="panel">
          <div className="panel-face">
            <div className="panel-bar">
              <b>Every day on the record</b>
              <span>
                {nf(d.activityHeatmap.length)} active days
                {periodDays ? ` of ${nf(periodDays)}` : ""}
              </span>
            </div>
            <dl className="beta-pilot-cells beta-pilot-cells--big beta-pilot-cells--lead beta-pilot-streaks">
              {streakCells.map((c) => (
                <div key={c.label}>
                  <dt>{c.label}</dt>
                  <dd>{c.value}</dd>
                  <dd className="beta-pilot-cells__sub">{c.sub}</dd>
                </div>
              ))}
            </dl>
            <DayCalendar
              caption={`Transcript records per day and per calendar week, ${period}`}
              summary={`${nf(L.totalMessages)} transcript records on ${nf(d.activityHeatmap.length)} days between ${period}. The busiest day is ${longDate(S.peakDay) ?? S.peakDay} with ${nf(S.peakDayCount)}${S.peakWeek && typeof S.peakWeekCount === "number" ? `, and the busiest week begins ${longDate(S.peakWeek) ?? S.peakWeek} with ${nf(S.peakWeekCount)}` : ""}.`}
              unit="records"
              cellIs={dayZone === "UTC" ? "one UTC day" : "one day"}
              days={days}
              start={since}
              end={through}
              mark={S.peakDay ? { date: S.peakDay, label: "busiest day" } : undefined}
              split={
                splitOk
                  ? {
                      date: began!,
                      before: `incomplete before ${shortDate(began)}`,
                      after: `recorded from ${shortDate(began)}`,
                    }
                  : undefined
              }
            />
            <p className="beta-chart__note">
              A streak is consecutive{dayZone ? ` ${dayZone}` : ""} days with at least one record.
              The bar over each column is that calendar week, Monday to Sunday; the first and last
              are part weeks.
              {longDate(began)
                ? ` The pale months at the start are not a slow start: the record has been kept since ${longDate(began)}, and before that it holds only the sessions whose logs were still on disk.`
                : ""}
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-face">
            <div className="panel-bar">
              <b>Hours of the day</b>
              <span>{hourZone.replace(/_/g, " ")}</span>
            </div>
            <HourStrips hours={d.hourlyDistribution.hours} zone={hourZone} />
            <p className="beta-chart__note">
              Hours of the day in {hourZone.replace(/_/g, " ")}, summed over the whole period. The
              bar marked now is the hour it is there as you read this.
            </p>
          </div>
        </div>
      </div>
      {chip("activityHeatmap, hourlyDistribution and streaks")}

      {/* ============================ MODELS =============================== */}
      <div className="prose beta-sec">
        <h2 id="models">Models flown</h2>
        <p>
          {nf(d.typeRatings.length)} models, each drawn from the first day to the last day it
          appears in the record. The figure on the right is its share of all output tokens, and
          the type rating is a band of that share and nothing more: {ratingRule}, Exposure below
          that.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Type ratings</b>
            <span>share of output tokens</span>
          </div>
          <SpanRows
            caption={`When each model was flown, ${period}`}
            summary={
              lead
                ? `${nf(d.typeRatings.length)} models between ${period}. ${modelName(lead)} wrote the largest share of output tokens, ${pctText(modelShare(lead))}.`
                : "No models recorded."
            }
            rows={modelRows}
            ticks={monthTicks}
          />
        </div>
      </div>

      {/* ============================ MISSIONS ============================= */}
      <div className="prose beta-sec">
        <h2 id="missions">Mission log</h2>
        <p>
          A mission is a project, and a project is the directory a session started in, so these
          are directory names as they sit on disk. Each bar runs from the first active day to the
          last; the figure on the right is messages. Subagent logs are not counted.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Missions</b>
            <span>
              busiest {nf(d.missionLog.length)} of {nf(projectTotal)} projects
            </span>
          </div>
          <SpanRows
            caption={`First to last active day, and messages, ${period}`}
            summary={`The busiest ${nf(d.missionLog.length)} of ${nf(projectTotal)} projects by transcript records, in ${nf(missionRows.length)} rows, with the span of days each was active.`}
            rows={missionRows}
            ticks={monthTicks}
          />
          <p className="beta-chart__note">
            The busiest {nf(d.missionLog.length)} of {nf(projectTotal)} projects by messages.
            {grouped > 0 && (
              <>
                {" "}
                The row marked cb* is {nf(grouped)} directories whose names begin with cb, summed.
                Most are repositories in the Nominate-AI organisation, which are private;{" "}
                <Link href="/work#nominate-ai">/work</Link>
                {" gives that organisation's totals without naming its repositories, and so does this log."}
              </>
            )}
            {withheld > 0
              ? ` ${withheld === 1 ? "One more is" : `${nf(withheld)} more are`} not listed at all; ${withheld === 1 ? "its" : "their"} sessions and messages are still in every total on this page.`
              : ""}
          </p>
        </div>
      </div>
      {chip("typeRatings and missionLog")}

      {/* ============================ TOOLS ================================ */}
      {tools && headParts.length > 0 && (
        <>
          <div className="prose beta-sec">
            <h2 id="tools">Top tools</h2>
            <p>
              What the model reached for.{" "}
              {typeof L.totalToolCalls === "number"
                ? `${nf(L.totalToolCalls)} tool calls in the period${toolKinds ? `, across ${toolKinds} distinct tools` : ""}. `
                : ""}
              Most of flying is the shell.
            </p>
          </div>

          <div className="panel">
            <div className="panel-face">
              <div className="panel-bar">
                <b>Tools</b>
                <span>share of all calls</span>
              </div>
              <ShareBar
                caption="Share of all tool calls, by tool"
                summary={`${headParts[0].label} is ${headParts[0].display} of all tool calls${headParts.length > 1 ? `; the next ${headParts.length - 1} together are ${pctText((headShare - headParts[0].share) * 100)}` : ""}.`}
                parts={headParts}
                rest={restPart}
              />
              {tailRows.length > 0 && (
                <div className="beta-pilot-tail">
                  <RowChart
                    caption={
                      tools.exact
                        ? `The next ${tailRows.length}, calls`
                        : `The next ${tailRows.length}, share of all tool calls`
                    }
                    data={tailRows}
                  />
                </div>
              )}
              {!tools.exact && (
                <p className="beta-chart__note">
                  Shares, not counts, on purpose. This list is read from the raw tool-call table,
                  which holds some rows twice
                  {toolOverPct !== null && toolOverPct > 0
                    ? ` (it runs about ${toolOverPct.toFixed(1)}% over the corrected total above)`
                    : ""}
                  . The duplicates are spread evenly enough that the shares hold; the counts would
                  not.
                </p>
              )}
            </div>
          </div>
          <p className="measured beta-pilot-chip">
            <span>
              <b>{tools.source}</b> {tools.exact ? "toolUsage" : "by_tool"}
              {toolPeriod ? `, ${toolPeriod}` : ""}
              {longDate(tools.generated) ? `, generated ${longDate(tools.generated)}` : ""}
              {tools.exact ? "" : ", the raw tool-call table of the same activity record"}
            </span>
          </p>
        </>
      )}

      {/* ============================ RATINGS ============================== */}
      <div className="prose beta-sec">
        <h2 id="ratings">Ratings</h2>
        <p>
          Read these as rough. Instrument ratings come from the words in each project&apos;s
          CLAUDE.md, the plan files and the technologies named in the session logs still on disk,
          which reach back about 30 days. Each domain&apos;s score is half keyword coverage and
          half its mentions against the busiest domain&apos;s, and keywords are matched as plain
          substrings. They measure what the work touched rather than how well it went, and they
          describe recent work, not the whole record.
        </p>
        <p>
          Competency scores are fixed formulas over counts from the record, the plan files on disk
          and the prompt history, and the count each one was computed from is printed under its
          name. Debugging assumes every shell, search and read call is debugging, which overstates
          it. The formulas stop at 95
          {atCap > 0 ? `, and ${atCap === 1 ? "one score sits" : `${nf(atCap)} scores sit`} at that cap` : ""}
          . Piloting style is two ratios: directive is twice the share of tool calls that were
          Edit or Write, and plan first rises with plan files per session.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Ratings</b>
            <span>0 to 100</span>
          </div>
          <div className="beta-pilot-pair beta-pilot-pair--wide">
            <SpanRows
              caption="Instrument ratings, by domain"
              summary={`${nf(instrumentRows.length)} domains scored 0 to 100, half keyword coverage and half mentions. The highest is ${instrumentRows[0]?.label ?? "none"} at ${instrumentRows[0]?.value ?? "0"}.`}
              rows={instrumentRows}
              ticks={scoreTicks}
            />
            <div>
              <SpanRows
                caption="Competency profile"
                summary={`${nf(competencyRows.length)} competency scores, 0 to 100, each computed from a count.`}
                rows={competencyRows}
                ticks={scoreTicks}
              />
              <SpanRows
                caption={`Piloting style: ${P.label}`}
                summary={`Piloting style is ${P.label}: ${P.collaborative}% collaborative against ${P.directive}% directive, and ${P.planFirst}% plan first against ${P.iterate}% iterate.`}
                rows={styleRows}
                ticks={scoreTicks}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================ WHAT CAME UP ========================= */}
      <div className="prose beta-sec">
        <h2 id="came-up">What came up</h2>
        <p>
          Technologies by how often they appear in a sample of the session logs still on disk
          {typeof sampled === "number" ? ` (${nf(sampled)} files)` : ""}, which reach back about
          30 days, and in each project&apos;s CLAUDE.md. This counts mentions, not proficiency,
          and it describes recent work, not the whole record.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Skills cloud</b>
            <span>
              top {skillRows.length} of {skills.length}
            </span>
          </div>
          <RowChart caption="Mentions in session transcripts" data={skillRows} />
          {dropped.length > 0 && (
            <p className="beta-chart__note">
              {dropped.join(", ")} {dropped.length === 1 ? "is" : "are"} left out. The count
              matches a name anywhere inside a word, and those{" "}
              {dropped.length === 1 ? "letters turn" : "names turn"} up inside ordinary English
              (going, digit, trust, despite, draws), so their totals are not mentions of the
              technology.
            </p>
          )}
        </div>
      </div>
      {chip(
        "competencyRadar and pilotingStyle",
        `${periodShort}; instrumentRatings and skillsCloud, a sample of the logs still on disk (about the last 30 days)`,
      )}

      {/* ============================ TOKENS =============================== */}
      <div className="prose beta-sec">
        <h2 id="tokens">Token economy</h2>
        <p>
          What the flying burned. Nearly all of it is cache reads: the same context, read again
          on every turn.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Tokens</b>
            <span>{sinceLong ? `since ${sinceLong}` : "period not recorded"}</span>
          </div>
          <div className="beta-pilot-pair beta-pilot-pair--wide">
            <table className="readout beta-pilot-tokens">
              <caption className="sr-only">Token totals, {period}</caption>
              <tbody>
                {tokenRows.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td className="num">
                      {tokens(r.n)}
                      <span className="beta-pilot-exact">{nf(r.n)}</span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Cache efficiency</td>
                  <td className="num">
                    {T.cacheEfficiency.toFixed(1)}%
                    <span className="beta-pilot-exact">of the input side</span>
                  </td>
                </tr>
                {typeof L.totalApiCalls === "number" && (
                  <tr>
                    <td>Model responses</td>
                    <td className="num">{nf(L.totalApiCalls)}</td>
                  </tr>
                )}
                <tr>
                  <td>Cost at API list price</td>
                  <td className="num">{cost ?? COST_NOT_COMPUTED}</td>
                </tr>
              </tbody>
            </table>
            {daily.length > 0 && (
              <div>
                <BarStrip
                  caption={`Input plus output tokens per day, last ${nf(daily.length)} active days`}
                  summary={`Input plus output tokens per day over the last ${nf(daily.length)} active days. The heaviest is ${longDate(dailyPeak.date) ?? dailyPeak.date} with ${nf(dailyPeak.tokens)}.`}
                  unit="tokens"
                  data={daily.map((t) => ({ label: longDate(t.date) ?? t.date, value: t.tokens }))}
                  ticks={dailyTicks}
                  height={96}
                />
                <p className="beta-chart__note">
                  Cache tokens are not in these bars.
                  {lastDailyIsRunDay
                    ? " The last bar is the day the file was generated, so it is a part day."
                    : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {chip("tokenEconomy")}

      <p className="quiet beta-pilot-fine">
        Each total is shown abbreviated and, under it, exactly. Cache efficiency is cache read as a
        share of everything on the input side: input, cache read and cache created together.
        {cost === null ? ` Cost is not computed: ${costReason}.` : ""}
      </p>
      {d.coverage?.definitions?.tokens && (
        <p className="quiet beta-pilot-fine">
          How tokens are counted. {keepDates(d.coverage.definitions.tokens)}
        </p>
      )}

      {/* ============================ RELATED ============================== */}
      <div className="prose beta-sec">
        <h2>Keep reading</h2>
        <p>
          This page is the receipts. Two longer reads sit beside it:{" "}
          <Link href="/the-shift">The shift</Link>, the argument, and{" "}
          <Link href="/cost-analysis">Cost analysis</Link>, the bottom-up cost model.
        </p>
      </div>
    </div>
  )
}
