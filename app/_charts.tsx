import type { CSSProperties, ReactNode } from "react"
import {
  SEQUENTIAL,
  SEQUENTIAL_EMPTY,
  CHART_INK,
  CHART_SURFACE,
  SERIES,
  STATE,
  rampStep,
} from "@/lib/beta/chart-theme"

/**
 * bradley.io's charts. Server-rendered, no charting library, no client
 * JavaScript, no hooks: every export here is a plain function of its props and
 * works in a server component (and, having no state, inside a client one too:
 * every number is formatted in a fixed locale, so server and browser agree).
 *
 * ---------------------------------------------------------------------------
 * THE VOCABULARY
 *
 *   RowChart      magnitude across named categories, as horizontal rows
 *   HeatGrid      magnitude across many unnamed buckets, wrapped, no calendar
 *   RampKey       the sequential ramp's key, once per page
 *   Sparkline     the SHAPE of one series, inline, in a table row or a card
 *   BarStrip      N time buckets as small vertical bars, one optional "now" bar
 *   CalendarHeat  daily counts on a real calendar (weeks as columns)
 *   LineChart     one or two series over time, with axes and end labels
 *   TenureBars    spans on one shared time axis (a career, a set of projects)
 *
 * and three helpers that shape the site's data for them:
 *   weekBuckets, monthBuckets   daily counts into weeks or calendar months
 *   parseYears                  "2018 to 2022" into a TenureBars row
 *
 * Pick by the question, not by the look:
 *   "which is biggest?"                    RowChart
 *   "how did it move?" (no numbers needed) Sparkline
 *   "how did it move?" (numbers matter)    LineChart
 *   "what happened in each hour/month?"    BarStrip
 *   "which days, and what rhythm?"         CalendarHeat
 *   "when did each thing run?"             TenureBars
 *
 * ---------------------------------------------------------------------------
 * RULES EVERY CHART HERE FOLLOWS (and every caller must keep)
 *
 * 1. PANEL ONLY. A chart is the machine talking, so it sits inside
 *    <div className="panel"><div className="panel-face">. The colours are
 *    chosen against the panel ground; on paper the ocean line is 2:1 and the
 *    labels vanish. A .readout table cell on a panel counts as panel.
 * 2. SIBLING OF .prose, never a child of it.
 * 3. `caption` is the visible title: what is measured, in what unit, over what
 *    period. `summary` is the takeaway in one sentence ("Legacy cost reaches
 *    $559,469 by week 17; actual reaches $60,800."). It becomes the aria-label,
 *    so a screen reader hears the point instead of a picture. Write both. The
 *    values themselves are also in the DOM: a visually hidden table for the
 *    figure charts, a <title> for the sparkline.
 * 4. Colour comes from lib/beta/chart-theme.ts and nowhere else. Magnitude is
 *    the one sequential ocean ramp. Two series are ocean then burnt, in that
 *    order, always. Blue appears only for ACTIVE (BarStrip's `highlight`).
 *    Text is never a series colour: identity is the coloured mark beside it.
 * 5. Follow the chart with a provenance chip (BetaMeasured, app/_measured.tsx)
 *    naming the file and the period. The chart does not do this for you.
 * 6. No client state, so no JS tooltips. Hovering a bar, a day or a point shows
 *    the browser's own tooltip (a <title> or a title attribute), which is a
 *    convenience on top of the visible labels and the hidden table, never the
 *    only way in.
 * 7. Nothing here animates. The only motion is a 90ms hover response to the
 *    reader's own pointer.
 * 8. Each chart adapts to the width of its OWN box (container queries), not
 *    the viewport, so it can sit in a full-width panel or in one cell of a
 *    two-up grid and behave correctly in both. The cost of that: the chart's
 *    parent must give it a width (a panel-face, a block, a grid cell with
 *    minmax(0, 1fr)). Do not put one in an inline-flex or a shrink-to-fit box;
 *    it will collapse to nothing.
 * 9. In a .readout table at 320px there is room for a name, one number and a
 *    Sparkline. A fourth column overflows the panel.
 *
 * ---------------------------------------------------------------------------
 * EXPORTS, PROPS, USE AND MISUSE
 *
 * RowChart({ data: RowDatum[], caption, emptyNote? })
 *   RowDatum = { label, value, display? }
 *   FOR: commits per year, repos per language, messages per project.
 *   NOT FOR: time series with more than about a dozen buckets (use BarStrip),
 *   or anything where the order is time and the shape matters (LineChart).
 *
 * HeatGrid({ data: CellDatum[], caption, emptyNote? })
 *   CellDatum = { label, value }
 *   FOR: density across buckets when weekday alignment does not matter and the
 *   chart must fit a phone with no scroll container.
 *   NOT FOR: "which days of the week": that is CalendarHeat.
 *
 * RampKey({ low?, high? })
 *   The ramp legend for RowChart, HeatGrid and BarStrip. Once per page.
 *   CalendarHeat prints its own key with real numbers; do not add this to it.
 *
 * Sparkline({ values: number[], label, max?, endDot?, width?, height? })
 *   values   oldest first. Negative and non-finite values count as zero.
 *   label    REQUIRED aria-label and tooltip lead, e.g. "Commits per week, last
 *            26 weeks: 412 in total, busiest week 61."
 *   max      shared ceiling. Pass the same number to every sparkline in a table
 *            when rows must be comparable; omit it and each line fills its own
 *            height (shape only, heights NOT comparable between rows).
 *   endDot   default true. Marks the newest bucket.
 *   width, height   CSS px, default 96 by 24. It shrinks below `width` if the
 *            cell is narrower and never grows past it.
 *   Renders an inline <svg>, so it goes straight into a <td> or a card line.
 *   Empty or all-zero data draws the baseline alone. A single value draws a dot.
 *   The scale always starts at zero.
 *   FOR: per-row activity shape beside the real numbers, which stay in their
 *   own columns.
 *   NOT FOR: the only place a number lives (it has no axis and no labels), a
 *   series that goes negative, or anything on paper.
 *
 * BarStrip({ data: StripDatum[], caption, summary, unit?, highlight?, ticks?,
 *            height?, emptyNote? })
 *   StripDatum = { label, value }   label is the full bucket name for the
 *                                   tooltip and the table ("2026-10-02 16:00").
 *   unit       noun after a value: "min", "commits". Used in tooltip and table.
 *   highlight  { index, label }. Paints that one bar in ACTIVE blue and prints
 *              `label` under it ("latest hour"). The label is required because
 *              state must be legible without colour. Use it for "this is the
 *              current bucket" and for nothing else: not the biggest bar, not
 *              a bar you like. Omit it when the data is stale.
 *   ticks      ChartTick[] = { at: index, label }. Sparse labels under the
 *              bars, EVENLY spaced: every sixth bucket, say. On a narrow plot
 *              they thin to every second or third of what you gave (a
 *              container query, no script), so offer the ticks you would want
 *              at full width and let the row thin them. Uneven ticks cannot
 *              be thinned evenly.
 *   height     plot height in CSS px, default 56.
 *   The tallest bar's value is printed beside the caption, because a strip has
 *   no value axis and one stated number gives the rest their scale.
 *   Bars use the upper four ramp steps (the palest is invisible as a thin bar).
 *   The strip fills the width it is given. A bar is 72% of its slot and never
 *   wider than 2.5rem, so in a full-width panel the gaps grow, not the bars.
 *   Only a strip of fewer than about a dozen buckets stops short (6rem a slot).
 *   All-zero data draws the baseline and says so. Empty data shows emptyNote.
 *   FOR: a 24-hour pulse, 24 months of commit intensity, sessions by hour.
 *   NOT FOR: more than about 60 buckets (the bars become hairlines: use
 *   CalendarHeat or LineChart), named categories (RowChart), or two series.
 *
 * CalendarHeat({ days: DayDatum[], caption, summary, unit?, start?, end?,
 *                cellIs?, emptyNote? })
 *   DayDatum = { date: "YYYY-MM-DD", value }   only the first ten characters of
 *              `date` are read, so a full ISO stamp is fine. Days missing from
 *              the array count as zero; two entries for one day are summed.
 *   start,end  "YYYY-MM-DD". The window to draw. Default: the first and last
 *              date in `days`. Pass them when the data only lists active days
 *              and the period is longer than the data (the timeline JSONs do
 *              this). At most 53 weeks are drawn: a longer window keeps its
 *              end and loses its beginning, and the key prints the real range.
 *   unit       plural noun for the count: "commits", "records".
 *   cellIs     what one cell is, default "one day". Say "one UTC day" when the
 *              source buckets in UTC.
 *   Weeks are columns, rows run Monday to Sunday, months are labelled on top.
 *   The key under the grid states the range, what a cell is, and the value
 *   range of every shade, in numbers. Shades are quantile bins of the non-zero
 *   days, so one enormous day does not flatten the rest of the year.
 *   On a narrow screen the grid scrolls sideways inside its own box, opened at
 *   the most recent week; the page itself never scrolls sideways.
 *   A window with no activity draws the empty grid and says so.
 *   FOR: 5 weeks to a year of daily counts.
 *   NOT FOR: more than a year (aggregate to months and use BarStrip), hourly
 *   data, or values that are not counts.
 *
 * LineChart({ x: string[], series: [LineSeries] | [LineSeries, LineSeries],
 *             caption, summary, ticks?, format?, formatTick?, gap?, height?,
 *             emptyNote? })
 *   x          one label per point, oldest first ("2026-W05", "2026-02-02").
 *              Points are evenly spaced, so the buckets must be too.
 *   LineSeries = { name, values: number[] }   same length as `x`. A non-finite
 *              value breaks the line at that point instead of drawing a zero.
 *   Series 1 is ocean, series 2 is burnt. A third is not accepted: use small
 *   multiples (two charts).
 *   ticks      ChartTick[] for the x axis. Four or five, evenly spaced, is
 *              plenty; they thin on a narrow plot the same way BarStrip's do.
 *   format     value to text for end labels, tooltip and table. Default is a
 *              thousands-separated number. Pass (n) => "$" + ... for money.
 *   formatTick value to text for the y axis only, where room is tight
 *              ("$200k"). Defaults to `format`.
 *   gap        { label, at? }. Two series only. Draws a bracket between the two
 *              lines at index `at` (default: the last point) with your label
 *              beside it ("$498,669 apart"). You compute the number; the chart
 *              does not invent it. Where the lines run too close together for
 *              the label to sit between them, it is printed beside the
 *              caption instead and the bracket stays.
 *   height     plot height in CSS px, default 220.
 *   Zero is always on the y axis and both series share it: never plot two
 *   different units here. A negative value is drawn below zero (the axis
 *   extends to hold it and the zero line is inked stronger), so a net-change
 *   series is fine. Each series gets an end label in text ink beside a
 *   colour key; with two series there is also a legend, with one there is
 *   none (the caption names it).
 *   FOR: cumulative cost, cumulative commits, anything where the level over
 *   time is the point and the reader may want the numbers.
 *   NOT FOR: more than two series, two different units, unevenly spaced
 *   points, or a tiny inline trend (Sparkline).
 *
 * TenureBars({ rows: TenureRow[], caption, summary, asOf, from?, tickEvery?,
 *              emptyNote? })
 *   TenureRow = { label, sub?, start: year, end: year | "present" }
 *   Years are whole calendar years, because that is all a resume line gives.
 *   HOW A SPAN IS DRAWN: from the start of `start` to the START of `end`.
 *   "2018 to 2022" followed by "2022 to present" is one handover in 2022, so
 *   the two bars meet on the 2022 gridline instead of both claiming the year.
 *   A lone year (start === end, "2008") is drawn as that whole year. Every end
 *   is right to within a year; say "year resolution" in your provenance chip.
 *   Bars that DO overlap therefore mean two things really ran together.
 *   asOf       "YYYY-MM-DD", REQUIRED. What "present" means: the date the
 *              source was last confirmed. Open bars end exactly there, the
 *              axis marks it ("Feb 2026") at that date, and no bar is drawn
 *              past it. Never the wall clock: a resume last touched in
 *              February is not evidence about October.
 *   from       first year on the axis. Default: the earliest start.
 *   tickEvery  years between gridlines. Default picks 1, 2, 5 or 10.
 *   Every axis label sits on its own date: a year names its 1 January.
 *   Under 40rem of its own width each row stacks: name, then sub-label and
 *   years, then a full-width track.
 *   The label, the sub-label and the years are real text in the DOM, so this
 *   one is a labelled list rather than role="img": nothing is hidden behind a
 *   picture and it needs no shadow table.
 *   FOR: a career, the lifespans of a set of projects, phases of an org.
 *   NOT FOR: durations shorter than a year (the axis is whole years), or
 *   magnitude (bar LENGTH is time here, not size).
 *
 * weekBuckets(days: DayDatum[], end: "YYYY-MM-DD", weeks: number): number[]
 *   Daily values summed into rolling seven-day buckets ending ON `end`, oldest
 *   first. Feeds Sparkline. Map your source first: the timeline JSONs carry
 *   { date, commits }, so days.map((d) => ({ date: d.date, value: d.commits })).
 *
 * monthBuckets(days: DayDatum[], end: "YYYY-MM-DD", months: number): StripDatum[]
 *   Daily values summed into calendar months ending with `end`'s month, oldest
 *   first, labelled "YYYY-MM". Feeds BarStrip. The newest month is partial.
 *
 * parseYears(text): { start, end } | null
 *   "2018 to 2022", "2008" or "2024 to present" (the `years` strings in
 *   lib/resume.ts) as the start and end of a TenureRow. Null when it does not
 *   parse: count the nulls, do not hide them.
 *     rows = ROLES.flatMap((r) => { const y = parseYears(r.years)
 *       return y ? [{ label: r.company, sub: r.title, ...y }] : [] })
 *
 * Also exported: RowDatum, CellDatum, StripDatum, DayDatum, LineSeries,
 * TenureRow, ChartTick (types), and CHART_INK.
 * ---------------------------------------------------------------------------
 *
 * WHY THE ORIGINAL TWO ARE ROWS
 *
 * RowChart and HeatGrid are horizontal on purpose, and that is a mobile
 * decision before it is an aesthetic one. A vertical bar chart puts its category
 * labels on the x axis, where at 320px they either rotate, truncate or collide;
 * rows put the label in its own column and let the plot take whatever is left.
 *
 * Each carries a direct label on every row, so identity and value are never
 * colour-alone and no hover layer is needed to read the chart. The <title>
 * element adds a native tooltip on top of that, which costs nothing and needs no
 * script.
 *
 * HOW THE NEWER ONES STAY LEGIBLE AT 320px
 *
 * An SVG with a viewBox scales its text with its width, so a chart that reads
 * at 1000px prints 4px labels on a phone. None of these put a word inside a
 * scaled SVG. A line plot is an SVG stretched to its box (preserveAspectRatio
 * "none", strokes held at their pixel width by vector-effect), and every label
 * is HTML positioned over it by percentage, so type stays at the kit's own
 * sizes at any width. BarStrip and TenureBars are HTML throughout, like
 * RowChart: their marks are boxes, and CSS can cap a box where SVG cannot.
 * CalendarHeat is the exception that proves it: its cells must stay square, so
 * it is drawn at natural size and scrolls.
 */

/** Thousands-separated, in a fixed locale so server output never varies. */
const nf = (n: number): string => n.toLocaleString("en-US")

/** A plottable number: anything else is treated as absent. */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

/** Percentages in inline styles: four decimals is sub-pixel at any width. */
const pct = (f: number): string => `${Math.round(f * 1_000_000) / 10_000}%`

export interface RowDatum {
  label: string
  value: number
  /** Optional right-hand annotation, e.g. "12 repos". Defaults to the value. */
  display?: string
}

/**
 * Magnitude as rows. One hue, because a single series needs no categorical
 * palette and the heading already names it.
 *
 * Rows are shaded along the sequential ramp by their own share of the maximum,
 * so the ramp encodes the same thing the bar length does. That is redundant
 * encoding rather than a second variable: it is what keeps the chart readable
 * in greyscale, in forced-colors mode, and for a reader who cannot separate the
 * hues at all.
 */
export function RowChart({
  data,
  caption,
  emptyNote = "No data.",
}: {
  data: RowDatum[]
  /** Names what is being measured. Required: a chart with no title is a shape. */
  caption: string
  emptyNote?: string
}) {
  const max = Math.max(0, ...data.map((d) => d.value))

  if (!data.length || max <= 0) {
    return (
      <div className="beta-chart">
        <div className="beta-chart__cap">{caption}</div>
        <p className="quiet">{emptyNote}</p>
      </div>
    )
  }

  return (
    <div className="beta-chart">
      <div className="beta-chart__cap">{caption}</div>
      <div className="beta-chart__rows" role="list">
        {data.map((d, i) => {
          const share = d.value / max
          return (
            <div
              className="beta-chart__row"
              role="listitem"
              // Index-suffixed: a caller can legitimately produce two rows with
              // the same label (two /24s in the same city), and keying on the label
              // alone makes React drop one of them.
              key={`${d.label}-${i}`}
              // A `title` attribute, not a <title> element: the latter is an SVG
              // thing and is invalid inside HTML. Both the label and the value
              // are already visible, so this is a convenience rather than the
              // only way to read the row.
              title={`${d.label}: ${d.display ?? nf(d.value)}`}
            >
              <span className="beta-chart__lbl">{d.label}</span>
              <span className="beta-chart__track">
                <span
                  className="beta-chart__fill"
                  style={{
                    // Floor the width so a nonzero value is never invisible: a
                    // bar that rounds to nothing reads as an absent row.
                    width: `${Math.max(share * 100, 1.5)}%`,
                    background: rampStep(share),
                  }}
                />
              </span>
              <span className="beta-chart__val">{d.display ?? nf(d.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface CellDatum {
  /** Cell label, used in the tooltip and by assistive tech. */
  label: string
  value: number
}

/**
 * A magnitude grid: activity per day, per hour, per bucket.
 *
 * Cells wrap rather than sitting on a fixed 7-row calendar. A real calendar
 * heatmap needs 53 columns, which cannot be made legible at 320px by any means
 * short of a scroll container, and a scroll container hides exactly the shape
 * the chart exists to show. Wrapping loses the day-of-week alignment and keeps
 * the density, which is the trade worth making here. When the weekday rhythm IS
 * the point, CalendarHeat below makes the other trade and scrolls.
 *
 * The ramp is the same one the row charts use, so a reader learns it once.
 */
export function HeatGrid({
  data,
  caption,
  emptyNote = "No data.",
}: {
  data: CellDatum[]
  caption: string
  emptyNote?: string
}) {
  const max = Math.max(0, ...data.map((d) => d.value))

  if (!data.length || max <= 0) {
    return (
      <div className="beta-chart">
        <div className="beta-chart__cap">{caption}</div>
        <p className="quiet">{emptyNote}</p>
      </div>
    )
  }

  return (
    <div className="beta-chart">
      <div className="beta-chart__cap">{caption}</div>
      <div className="beta-heat" role="img" aria-label={`${caption}. ${data.length} buckets.`}>
        {data.map((d, i) => (
          <i
            key={`${d.label}-${i}`}
            title={`${d.label}: ${nf(d.value)}`}
            style={{ background: rampStep(d.value / max) }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * The sequential ramp, shown once per page that uses it.
 *
 * A ramp with no key is a decoration. This is deliberately not a per-chart
 * legend: the ramp means the same thing on every chart on the page, and
 * repeating it would imply otherwise.
 */
export function RampKey({ low = "fewer", high = "more" }: { low?: string; high?: string }) {
  return (
    <p className="beta-ramp">
      <span className="beta-ramp__lbl">{low}</span>
      <span className="beta-ramp__swatches" aria-hidden="true">
        <i style={{ background: SEQUENTIAL_EMPTY }} />
        {SEQUENTIAL.map((c) => (
          <i key={c} style={{ background: c }} />
        ))}
      </span>
      <span className="beta-ramp__lbl">{high}</span>
    </p>
  )
}

/* ===========================================================================
   SHARED PIECES
   ======================================================================== */

/** A sparse axis label: the index of the bucket or point, and what to print. */
export interface ChartTick {
  at: number
  label: string
}

/**
 * The table twin: the same numbers as the picture, for a reader who cannot use
 * the picture. Wrapped in a div because `sr-only` on a <table> itself does not
 * hold: a table ignores a 1px height and grows to its rows, which can add
 * scroll height to the page from an element nobody can see.
 */
function DataTable({
  caption,
  head,
  rows,
}: {
  caption: string
  head: string[]
  rows: (string | number)[][]
}) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {c}
                  </th>
                ) : (
                  <td key={j}>{c}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The figure a chart becomes when there is nothing to draw. */
function EmptyFigure({ caption, note }: { caption: string; note: ReactNode }) {
  return (
    <figure className="beta-chart">
      <figcaption className="beta-chart__cap">{caption}</figcaption>
      <p className="quiet">{note}</p>
    </figure>
  )
}

/** A label under a plot: where it sits (0 to 1 across the plot) and its text. */
interface AxisLabel {
  pos: number
  label: string
  /** Carries state (the highlighted bar, the as-of date): never dropped. */
  mark?: boolean
  key: string
}

/**
 * Which labels hang from an edge instead of centring on their point: the
 * leftmost if it is within a tenth of the left edge, the rightmost likewise.
 * Only those two. A second label that merely happens to be near an edge stays
 * centred like every other, or it would sit off its own tick.
 */
function tickAnchors(ticks: AxisLabel[]): ("start" | "end" | "")[] {
  let lo = -1
  let hi = -1
  ticks.forEach((t, i) => {
    if (lo < 0 || t.pos < ticks[lo].pos) lo = i
    if (hi < 0 || t.pos >= ticks[hi].pos) hi = i
  })
  return ticks.map((t, i) => (i === lo && t.pos < 0.1 ? "start" : i === hi && t.pos > 0.9 ? "end" : ""))
}

/** Container widths, in CSS px, at which the set of visible labels is re-chosen. */
const TICK_STEPS = [160, 240, 360, 560] as const

/**
 * Decide, on the server, which labels show at which width.
 *
 * The server cannot know how wide the plot will be, and axis labels that fit at
 * 1000px print over each other at 240px. So the choice is made once per width
 * band, and container queries in app/kit.css show each band's set. No script,
 * no measuring. Widths are estimated from the character count: the labels are
 * IBM Plex Mono at 11px, where every glyph advances 6.6px.
 *
 * Within a band:
 *   1. Marks (the highlighted bar, the as-of date) always show. They are state.
 *   2. The first and last labels (see tickAnchors) show if they clear the marks.
 *   3. The labels between are thinned to an EVEN STRIDE: all of them, or every
 *      second, or every third, never an arbitrary first-fit subset. A label
 *      that lands under a mark or an edge label gives way to it; and if what
 *      is left would show a hole wider than 1.6 strides, the stride is
 *      rejected and the next one tried. First-fit placement used to produce
 *      "2024-11, 2025-11, 2026-05": honest positions that read as a mistake.
 *
 * Returns, per label, whether it shows in each band of TICK_STEPS.
 */
function tickPlan(ticks: AxisLabel[]): boolean[][] {
  const CHAR = 6.6
  const GAP = 8
  const anchor = tickAnchors(ticks)
  const span = (i: number, w: number): [number, number] => {
    const px = ticks[i].label.length * CHAR + GAP
    const x = ticks[i].pos * w
    if (anchor[i] === "start") return [x, x + px]
    if (anchor[i] === "end") return [x - px, x]
    return [x - px / 2, x + px / 2]
  }
  const all = ticks.map((_, i) => i)
  const marks = all.filter((i) => ticks[i].mark)
  const edges = all.filter((i) => !ticks[i].mark && anchor[i] !== "")
  const inner = all
    .filter((i) => !ticks[i].mark && anchor[i] === "")
    .sort((a, b) => ticks[a].pos - ticks[b].pos)

  // One stride, as a fraction of the plot: the median spacing of the inner
  // labels, so a single irregular gap in the caller's ticks does not skew it.
  const diffs = inner
    .slice(1)
    .map((i, j) => ticks[i].pos - ticks[inner[j]].pos)
    .filter((d) => d > 0)
    .sort((a, b) => a - b)
  const base = diffs.length ? diffs[Math.floor(diffs.length / 2)] : 1

  const show = ticks.map(() => TICK_STEPS.map(() => false))

  TICK_STEPS.forEach((w, s) => {
    const at = (i: number) => span(i, w)
    const clash = (i: number, j: number) => {
      const [al, ar] = at(i)
      const [bl, br] = at(j)
      return !(ar <= bl || al >= br)
    }
    const fixed = [...marks]
    for (const i of edges) if (fixed.every((j) => !clash(i, j))) fixed.push(i)
    const free = inner.filter((i) => fixed.every((j) => !clash(i, j)))

    // The widest hole a candidate leaves, measured across the whole plot.
    const hole = (set: number[]): number => {
      const stops = [0, 1, ...[...fixed, ...set].map((i) => ticks[i].pos)].sort((a, b) => a - b)
      return Math.max(...stops.slice(1).map((p, j) => p - stops[j]))
    }

    let chosen: number[] | null = null
    let fallback: { set: number[]; hole: number } = { set: [], hole: hole([]) }
    for (let k = 1; k <= Math.max(1, inner.length) && !chosen; k++) {
      let best: { set: number[]; hole: number } | null = null
      for (let o = 0; o < k; o++) {
        const set = inner.filter((i, j) => j % k === o && free.includes(i))
        if (set.some((i, j) => j > 0 && clash(set[j - 1], i))) continue
        const h = hole(set)
        if (!best || h < best.hole - 1e-9 || (Math.abs(h - best.hole) <= 1e-9 && set.length > best.set.length)) {
          best = { set, hole: h }
        }
      }
      if (!best) continue
      if (best.hole <= 1.6 * k * base + 1e-9) chosen = best.set
      else if (best.hole < fallback.hole - 1e-9) fallback = best
    }

    for (const i of [...fixed, ...(chosen ?? fallback.set)]) show[i][s] = true
  })
  return show
}

/**
 * A row of sparse labels under a plot, positioned by fraction of its width.
 *
 * A label near either edge is anchored to that edge instead of centred on its
 * point, so the first and last labels never hang outside the panel. Labels
 * that would collide on a narrow plot wait for a wider one: see tickPlan.
 */
function TickRow({ ticks }: { ticks: AxisLabel[] }) {
  if (!ticks.length) return null
  const plan = tickPlan(ticks)
  const anchor = tickAnchors(ticks)
  return (
    <div className="beta-charts-ticks" aria-hidden="true">
      {ticks.map((t, i) => {
        const on = plan[i]
        if (!on.some(Boolean)) return null
        const edge = anchor[i] ? `is-${anchor[i]}` : ""
        return (
          <span
            key={t.key}
            className={[edge, t.mark ? "is-mark" : ""].filter(Boolean).join(" ") || undefined}
            // Absent when the label shows at every width; otherwise the bands
            // it shows in, which app/kit.css matches with [data-s~="240"].
            data-s={on.every(Boolean) ? undefined : TICK_STEPS.filter((_, s) => on[s]).join(" ")}
            style={{ left: pct(t.pos) }}
          >
            {t.label}
          </span>
        )
      })}
    </div>
  )
}

/* ===========================================================================
   SPARKLINE
   ======================================================================== */

/**
 * The shape of one series, small enough for a table cell.
 *
 * It has no axis and no labels, so it never carries a number by itself: the
 * numbers live in the columns beside it. What it adds is the one thing a table
 * of totals cannot show, which is whether the work was steady, bursty, or over.
 *
 * Zero-based always. A sparkline that auto-scales to its own minimum turns
 * "went from 40 to 41" into a cliff.
 */
export function Sparkline({
  values,
  label,
  max,
  endDot = true,
  width = 96,
  height = 24,
}: {
  /** Oldest first. */
  values: number[]
  /** aria-label: say the takeaway, not "sparkline". */
  label: string
  /** Shared ceiling across a set of sparklines. Omit to fill own height. */
  max?: number
  endDot?: boolean
  width?: number
  height?: number
}) {
  const v = values.map((x) => (isNum(x) && x > 0 ? x : 0))
  const top = Math.max(0, isNum(max) ? max : 0, ...v)
  const flat = v.length === 0 || top <= 0

  // Padding in real pixels: the viewBox is the element's own pixel box, so the
  // dot at either extreme has room and is never clipped by the cell.
  const padX = 4
  const padTop = 4
  const base = height - 1.5
  const xAt = (i: number) =>
    v.length === 1 ? width - padX : padX + (i / (v.length - 1)) * (width - 2 * padX)
  const yAt = (val: number) => base - (val / top) * (base - padTop)

  const path = flat
    ? ""
    : v.map((val, i) => `${i ? "L" : "M"}${xAt(i).toFixed(2)} ${yAt(val).toFixed(2)}`).join("")
  const last = v.length - 1

  return (
    <svg
      className="beta-charts-spark"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ maxWidth: width, height }}
    >
      <title>
        {v.length
          ? `${label} Values, oldest first: ${v.map(nf).join(", ")}.`
          : `${label} No data.`}
      </title>
      {/* The baseline is always there. With nothing to plot it is the whole
          chart, which reads as "measured, and flat" rather than as a hole. */}
      <line
        x1={0}
        x2={width}
        y1={height - 0.5}
        y2={height - 0.5}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        style={{ stroke: CHART_INK.grid }}
      />
      {!flat && v.length > 1 && (
        <path
          d={path}
          fill="none"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: SERIES[0].token }}
        />
      )}
      {!flat && (endDot || v.length === 1) && (
        <Dot x={xAt(last)} y={yAt(v[last])} size={5} ring={1.5} color={SERIES[0].token} />
      )}
    </svg>
  )
}

/**
 * A round marker that stays round in a stretched SVG.
 *
 * A <circle> in a preserveAspectRatio="none" plot becomes an ellipse. A
 * near-zero-length stroke with round caps and a non-scaling width does not:
 * its size is in screen pixels whatever the plot is stretched to. The wider
 * stroke under it, in the surface colour, is the ring that keeps the marker
 * legible where it sits on its own line.
 */
function Dot({
  x,
  y,
  size,
  ring,
  color,
}: {
  x: number
  y: number
  size: number
  ring: number
  color: string
}) {
  const d = `M${x.toFixed(3)} ${y.toFixed(3)}l0.001 0`
  return (
    <>
      <path
        d={d}
        fill="none"
        strokeLinecap="round"
        strokeWidth={size + ring * 2}
        vectorEffect="non-scaling-stroke"
        style={{ stroke: CHART_SURFACE }}
      />
      <path
        d={d}
        fill="none"
        strokeLinecap="round"
        strokeWidth={size}
        vectorEffect="non-scaling-stroke"
        style={{ stroke: color }}
      />
    </>
  )
}

/* ===========================================================================
   BAR STRIP
   ======================================================================== */

export interface StripDatum {
  /** Full bucket name, for the tooltip and the table. */
  label: string
  value: number
}

/**
 * The ramp for a bar, which starts one step up from the ramp's floor.
 *
 * The palest step is 20% ocean on panel. As a full-width row inside a sunk
 * track (RowChart) or a square cell beside its neighbours (the calendar) it
 * reads; as a 6px bar standing alone on the panel it does not, and a bar the
 * reader cannot see is a bucket reported as zero. So bars use the upper four
 * steps: still one hue, still light to dark, still ordered.
 */
const barShade = (share: number): string => (share > 0 ? rampStep(0.2 + 0.8 * share) : SEQUENTIAL_EMPTY)

/**
 * N time buckets as small vertical bars.
 *
 * Vertical is right here and wrong for RowChart for the same reason: these
 * buckets are consecutive moments, not named things, so they need no label
 * each and can sit 10px apart. Shading follows the same ramp as the row charts,
 * by share of the tallest bar, so length and shade say the same thing twice.
 *
 * The one bar that may break the ramp is `highlight`, in ACTIVE blue, and it
 * always comes with a printed label. It means "this bucket is now".
 *
 * The label is not a courtesy. Measured with the dataviz validator on the panel
 * ground, blue against ocean is dE 15.8 for normal vision (the floor is 15) and
 * 5.9 for tritan (the floor is 6): the colour alone is a hint, the word under
 * the bar is the statement.
 */
export function BarStrip({
  data,
  caption,
  summary,
  unit,
  highlight,
  ticks = [],
  height = 56,
  emptyNote = "No data.",
}: {
  data: StripDatum[]
  caption: string
  /** The takeaway, one sentence. Becomes the aria-label. */
  summary: string
  /** Noun after a value: "min", "commits". */
  unit?: string
  /** The current bucket. Blue, and labelled, or not at all. */
  highlight?: { index: number; label: string }
  ticks?: ChartTick[]
  height?: number
  emptyNote?: string
}) {
  const n = data.length
  if (!n) return <EmptyFigure caption={caption} note={emptyNote} />

  const v = data.map((d) => (isNum(d.value) && d.value > 0 ? d.value : 0))
  const max = Math.max(0, ...v)
  const withUnit = (x: number) => (unit ? `${nf(x)} ${unit}` : nf(x))
  const hi = highlight && highlight.index >= 0 && highlight.index < n ? highlight : undefined

  const centred: AxisLabel[] = [
    ...ticks
      .filter((t) => t.at >= 0 && t.at < n && t.at !== hi?.index)
      .map((t) => ({ pos: (t.at + 0.5) / n, label: t.label, key: `t${t.at}` })),
    ...(hi ? [{ pos: (hi.index + 0.5) / n, label: hi.label, mark: true, key: "hi" }] : []),
  ]
  // The two labels that hang from an edge of the row hang from the outer edge
  // of their own bar, not from its centre.
  const hang = tickAnchors(centred)
  const row = centred.map((t, i) =>
    hang[i] === "start" ? { ...t, pos: t.pos - 0.5 / n } : hang[i] === "end" ? { ...t, pos: t.pos + 0.5 / n } : t,
  )

  // The plot fills its panel: a strip that stopped short left a quarter of a
  // full-width panel empty. What keeps bars from becoming slabs is a cap on the
  // BAR (app/kit.css: 72% of its slot, never more than 2.5rem), so on a wide
  // panel the gaps grow and the bars do not. Only a strip of a few buckets is
  // held back, at 6rem a slot, so three bars do not scatter across a desk; the
  // figure narrows with it (with a floor for the caption) and the "tallest"
  // note stays beside its plot.
  const cap = `${n * 6}rem`
  return (
    <figure className="beta-chart beta-charts-strip" style={{ maxWidth: `max(${cap}, 24rem)` }}>
      <div className="beta-charts-head">
        <figcaption className="beta-chart__cap">{caption}</figcaption>
        <span className="beta-charts-head__note">
          {max > 0 ? `tallest ${withUnit(max)}` : `all ${n} buckets are zero`}
        </span>
      </div>
      <div role="img" aria-label={summary} style={{ maxWidth: cap }}>
        {/* HTML, not SVG: a bar in a stretched SVG scales with its slot, and
            only CSS can say "72% of the slot, but never wider than this". */}
        <div className="beta-charts-strip__bars" style={{ height }} aria-hidden="true">
          {data.map((d, i) => {
            const share = max > 0 ? v[i] / max : 0
            return (
              <span
                className="beta-charts-slot"
                key={`${d.label}-${i}`}
                title={`${d.label}: ${withUnit(v[i])}`}
              >
                {v[i] > 0 && (
                  <i
                    style={{
                      // Two pixels of headroom under the caption. The floor that
                      // keeps one commit visible beside a bar of 800 is a
                      // min-height in app/kit.css.
                      height: `calc(${pct(share)} - 2px)`,
                      background: hi?.index === i ? STATE.active : barShade(share),
                    }}
                  />
                )}
              </span>
            )
          })}
        </div>
        <TickRow ticks={row} />
      </div>
      <DataTable
        caption={caption}
        head={["Bucket", unit ?? "Value"]}
        rows={data.map((d, i) => [
          hi?.index === i ? `${d.label} (${hi.label})` : d.label,
          nf(v[i]),
        ])}
      />
    </figure>
  )
}

/* ===========================================================================
   CALENDAR HEAT
   ======================================================================== */

export interface DayDatum {
  /** "YYYY-MM-DD", or any ISO stamp that starts with one. */
  date: string
  value: number
}

const DAY_MS = 86_400_000
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** UTC midnight of an ISO day, by slicing: never the local zone. */
function dayMs(iso: string | undefined): number {
  if (!iso || iso.length < 10) return NaN
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
}
const isoDay = (t: number): string => new Date(t).toISOString().slice(0, 10)
/** Row for a day, Monday first. */
const weekRow = (t: number): number => (new Date(t).getUTCDay() + 6) % 7

/**
 * Value bins for the calendar: up to five, by quantile of the non-zero days.
 *
 * Linear bins on the maximum fail on real commit data. One 793-commit day puts
 * every ordinary day in the palest shade and the year reads as empty. Quantiles
 * give each shade a similar number of days, and the key prints the bounds, so
 * the trade is visible instead of hidden.
 *
 * Returns the inclusive upper bound of each bin, ascending.
 */
function quantileBins(nonZero: number[]): number[] {
  if (!nonZero.length) return []
  const sorted = [...nonZero].sort((a, b) => a - b)
  const distinct = [...new Set(sorted)]
  if (distinct.length <= SEQUENTIAL.length) return distinct
  const uppers = new Set<number>()
  for (let k = 1; k <= SEQUENTIAL.length; k++) {
    uppers.add(sorted[Math.ceil((k / SEQUENTIAL.length) * sorted.length) - 1])
  }
  return [...uppers].sort((a, b) => a - b)
}

/** Spread k bins across the five ramp steps so the top bin is always full ocean. */
const binShade = (i: number, k: number): string =>
  SEQUENTIAL[Math.max(0, Math.round(((i + 1) * SEQUENTIAL.length) / k) - 1)]

/**
 * Daily counts on a real calendar.
 *
 * This is the chart that shows rhythm: weekends, a quiet August, the week a
 * project shipped. It needs square cells and up to 53 columns, which is wider
 * than a phone, so it is the one chart here that scrolls. It scrolls inside its
 * own box, it opens at the newest week (a right-to-left scroller holding a
 * left-to-right grid), and the weekday labels stay put outside the scroller.
 */
export function CalendarHeat({
  days,
  caption,
  summary,
  unit = "",
  start,
  end,
  cellIs = "one day",
  emptyNote = "No data.",
}: {
  days: DayDatum[]
  caption: string
  /** The takeaway, one sentence. Becomes the aria-label. */
  summary: string
  /** Plural noun for the count: "commits". */
  unit?: string
  /** "YYYY-MM-DD". Defaults to the first date in `days`. */
  start?: string
  /** "YYYY-MM-DD". Defaults to the last date in `days`. */
  end?: string
  /** What one cell is. "one UTC day" when the source buckets in UTC. */
  cellIs?: string
  emptyNote?: string
}) {
  const byDay = new Map<number, number>()
  for (const d of days) {
    const t = dayMs(d?.date)
    if (!Number.isFinite(t)) continue
    byDay.set(t, (byDay.get(t) ?? 0) + (isNum(d.value) && d.value > 0 ? d.value : 0))
  }
  const seen = [...byDay.keys()]
  let t1 = dayMs(end)
  if (!Number.isFinite(t1)) t1 = seen.length ? Math.max(...seen) : NaN
  let t0 = dayMs(start)
  if (!Number.isFinite(t0)) t0 = seen.length ? Math.min(...seen) : NaN
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 < t0) {
    return <EmptyFigure caption={caption} note={emptyNote} />
  }

  // At most 53 columns. A longer window keeps its end and loses its start, and
  // the key prints the range that was actually drawn.
  const MAX_WEEKS = 53
  const lastMonday = t1 - weekRow(t1) * DAY_MS
  const earliest = lastMonday - (MAX_WEEKS - 1) * 7 * DAY_MS
  if (t0 < earliest) t0 = earliest

  const firstMonday = t0 - weekRow(t0) * DAY_MS
  const weeks = Math.round((lastMonday - firstMonday) / (7 * DAY_MS)) + 1

  const CELL = 11
  const STEP = CELL + 3
  const TOP = 16 // the month-label band
  const gridW = weeks * STEP - 3
  const gridH = 7 * STEP - 3

  const cells: { t: number; col: number; row: number; value: number }[] = []
  for (let t = t0; t <= t1; t += DAY_MS) {
    cells.push({
      t,
      col: Math.round((t - weekRow(t) * DAY_MS - firstMonday) / (7 * DAY_MS)),
      row: weekRow(t),
      value: byDay.get(t) ?? 0,
    })
  }

  const nonZero = cells.filter((c) => c.value > 0).map((c) => c.value)
  const total = nonZero.reduce((s, x) => s + x, 0)
  const uppers = quantileBins(nonZero)
  const shadeOf = (value: number): string => {
    if (!(value > 0)) return SEQUENTIAL_EMPTY
    const i = uppers.findIndex((u) => value <= u)
    return binShade(i < 0 ? uppers.length - 1 : i, uppers.length)
  }
  const whole = nonZero.every(Number.isInteger)
  const binLabel = (i: number): string => {
    const hi = uppers[i]
    if (!whole) return `up to ${nf(hi)}`
    const lo = i === 0 ? 1 : uppers[i - 1] + 1
    return lo === hi ? nf(hi) : `${nf(lo)} to ${nf(hi)}`
  }

  // A month is labelled over the column that holds its first drawn day. The
  // first column gets one too unless the next label would land on top of it.
  const monthLabels: { col: number; text: string }[] = []
  let prevMonth = -1
  for (const c of cells) {
    const m = new Date(c.t).getUTCMonth()
    if (m === prevMonth) continue
    prevMonth = m
    const lastLabel = monthLabels[monthLabels.length - 1]
    if (lastLabel && c.col - lastLabel.col < 3) {
      // Two labels within three columns collide. Keep the later one only when
      // the earlier is the partial month at the very start.
      if (lastLabel.col === 0 && monthLabels.length === 1) monthLabels.pop()
      else continue
    }
    monthLabels.push({ col: c.col, text: MONTHS[m] })
  }
  // A month that begins in the last column still gets its name: the drawing is
  // widened by the few pixels the label needs rather than clipping it to "Oc".
  const LABEL_W = 22
  const lastLabelCol = monthLabels.length ? monthLabels[monthLabels.length - 1].col : 0
  const width = Math.max(gridW, lastLabelCol * STEP + LABEL_W)

  // The table twin is by month: 365 rows of days is not a usable table.
  const byMonth = new Map<string, { total: number; active: number; days: number }>()
  for (const c of cells) {
    const key = isoDay(c.t).slice(0, 7)
    const m = byMonth.get(key) ?? { total: 0, active: 0, days: 0 }
    m.total += c.value
    m.days += 1
    if (c.value > 0) m.active += 1
    byMonth.set(key, m)
  }

  const noun = unit ? ` ${unit}` : ""

  return (
    <figure className="beta-chart beta-charts-cal">
      <figcaption className="beta-chart__cap">{caption}</figcaption>
      <div className="beta-charts-cal__body">
        <svg
          className="beta-charts-cal__days"
          width={26}
          height={TOP + gridH}
          viewBox={`0 0 26 ${TOP + gridH}`}
          aria-hidden="true"
        >
          {[0, 2, 4].map((r) => (
            <text key={r} x={0} y={TOP + r * STEP + CELL - 1.5} style={{ fill: CHART_INK.label }}>
              {WEEKDAYS[r]}
            </text>
          ))}
        </svg>
        {/* Focusable because it can scroll: a keyboard reader needs to reach it
            to move it. It is the image, so it carries the takeaway. */}
        <div className="beta-charts-cal__scroll" role="img" aria-label={summary} tabIndex={0}>
          <div className="beta-charts-cal__inner">
            <svg width={width} height={TOP + gridH} viewBox={`0 0 ${width} ${TOP + gridH}`}>
              {monthLabels.map((m) => (
                <text
                  key={`${m.col}-${m.text}`}
                  x={m.col * STEP}
                  y={10}
                  style={{ fill: CHART_INK.label }}
                >
                  {m.text}
                </text>
              ))}
              {cells.map((c) => (
                <rect
                  key={c.t}
                  x={c.col * STEP}
                  y={TOP + c.row * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  style={{ fill: shadeOf(c.value) }}
                >
                  <title>{`${isoDay(c.t)} (${WEEKDAYS[c.row]}): ${nf(c.value)}${noun}`}</title>
                </rect>
              ))}
            </svg>
          </div>
        </div>
      </div>
      <p className="beta-charts-key">
        <span>
          One cell is {cellIs}, {isoDay(t0)} to {isoDay(t1)}
        </span>
        <span className="beta-charts-key__bins">
          <span>
            <i style={{ background: SEQUENTIAL_EMPTY }} />0
          </span>
          {uppers.map((u, i) => (
            <span key={u}>
              <i style={{ background: binShade(i, uppers.length) }} />
              {binLabel(i)}
            </span>
          ))}
          {unit && <span>{unit}</span>}
        </span>
      </p>
      {total === 0 && (
        <p className="beta-chart__note">
          Nothing recorded in this window: {cells.length} days, all zero.
        </p>
      )}
      <DataTable
        caption={`${caption}, by month`}
        head={["Month", unit || "Total", "Active days", "Days in window"]}
        rows={[...byMonth.entries()].map(([k, m]) => [k, nf(m.total), m.active, m.days])}
      />
    </figure>
  )
}

/* ===========================================================================
   LINE CHART
   ======================================================================== */

export interface LineSeries {
  name: string
  /** Same length as `x`. A non-finite value breaks the line there. */
  values: number[]
}

/**
 * Round axis values: 0, 200,000, 400,000, 600,000. Zero is always one of them;
 * the axis reaches below it only as far as the lowest value needs.
 */
function niceTicks(lo: number, hi: number, whole: boolean, target = 4): number[] {
  const min = Math.min(0, lo)
  const max = Math.max(0, hi)
  if (!(max - min > 0)) return [0]
  const raw = (max - min) / target
  const pow = 10 ** Math.floor(Math.log10(raw))
  const m = raw / pow
  let step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * pow
  // Counts do not have a tick at 0.25.
  if (whole) step = Math.max(1, Math.ceil(step))
  const top = Math.ceil(max / step - 1e-9) * step
  const bottom = Math.floor(min / step + 1e-9) * step
  const out: number[] = []
  for (let t = bottom; t <= top + step / 2; t += step) out.push(Math.round(t * 1e6) / 1e6)
  return out
}

/**
 * One or two series over time.
 *
 * The furniture is quiet on purpose: hairline gridlines at round values, tick
 * labels in the muted ink, no frame. What is loud is the data, a 2px line per
 * series and a dot where each one ends, with the final value printed beside it
 * so the number a reader came for needs no tracing back to an axis.
 *
 * One axis, shared by both series, and zero is always on it. Two units on one
 * plot would let the chart invent a relationship, so that is not an option
 * here. A value below zero is drawn below zero: the axis extends down to hold
 * it and the zero line is inked a step stronger, so the picture and the printed
 * number can never disagree about the sign.
 */
export function LineChart({
  x,
  series,
  caption,
  summary,
  ticks = [],
  format = nf,
  formatTick,
  gap,
  height = 220,
  emptyNote = "No data.",
}: {
  /** One label per point, oldest first. Evenly spaced buckets. */
  x: string[]
  series: [LineSeries] | [LineSeries, LineSeries]
  caption: string
  /** The takeaway, one sentence. Becomes the aria-label. */
  summary: string
  ticks?: ChartTick[]
  /** Value to text: end labels, tooltip, table. */
  format?: (n: number) => string
  /** Value to text on the y axis only. Defaults to `format`. */
  formatTick?: (n: number) => string
  /** Two series only: a bracket between them, with your label. */
  gap?: { label: string; at?: number }
  height?: number
  emptyNote?: string
}) {
  const n = x.length
  const used = series.slice(0, 2).map((s, i) => ({
    name: s.name,
    color: SERIES[i].token,
    values: x.map((_, j) => (isNum(s.values[j]) ? s.values[j] : null)),
  }))
  const all = used.flatMap((s) => s.values).filter(isNum)
  if (!n || !all.length) return <EmptyFigure caption={caption} note={emptyNote} />

  const yTicks = niceTicks(Math.min(...all), Math.max(...all), all.every(Number.isInteger))
  const bottom = yTicks[0]
  // All zeros gives one tick, at zero: an axis of 0 to 1 puts it on the floor.
  const top = yTicks.length > 1 ? yTicks[yTicks.length - 1] : 1
  const fx = (i: number) => (n === 1 ? 1 : i / (n - 1))
  const fy = (val: number) => (top - val) / (top - bottom) // 0 is the top edge
  const tickText = formatTick ?? format

  // Each series as SVG path data in a 100 by 100 box, broken at missing points.
  const paths = used.map((s) => {
    let d = ""
    let pen = false
    s.values.forEach((val, i) => {
      if (val === null) {
        pen = false
        return
      }
      d += `${pen ? "L" : "M"}${(fx(i) * 100).toFixed(3)} ${(fy(val) * 100).toFixed(3)}`
      pen = true
    })
    return d
  })

  // Where each series ends: its last real point.
  const ends = used.map((s) => {
    let i = s.values.length - 1
    while (i >= 0 && s.values[i] === null) i--
    return i < 0 ? null : { i, value: s.values[i] as number }
  })

  // End labels sit above their line, right-aligned to its last point. "Above"
  // means above the highest value in the stretch the label covers (about the
  // last third of the plot), not just above the endpoint: a series that peaks
  // and then falls would otherwise have its label printed over its own peak.
  // For a series that rises to its end, which is the usual case, the two are
  // the same place.
  const two = used.length === 2
  const reach = Math.ceil((n - 1) * 0.35)
  const labels = used
    .map((s, k) => ({ ...s, end: ends[k] }))
    .filter((s): s is typeof s & { end: { i: number; value: number } } => s.end !== null)
    .map((s) => ({
      ...s,
      over: Math.max(
        s.end.value,
        ...s.values.slice(Math.max(0, s.end.i - reach), s.end.i + 1).filter(isNum),
      ),
    }))
  // When the two labels would sit closer than a label is tall, nudging them
  // apart would detach each from its line, so they stack as one block above
  // the higher of the two instead.
  const LABEL_PX = 30
  const stacked =
    labels.length === 2 && Math.abs(fy(labels[0].over) - fy(labels[1].over)) * height < LABEL_PX
  const blocks = (
    stacked ? [[...labels].sort((a, b) => b.end.value - a.end.value)] : labels.map((l) => [l])
  ).map((block) => ({
    block,
    over: Math.max(...block.map((b) => b.over)),
    last: Math.max(...block.map((b) => b.end.i)),
    inset: false,
  }))

  // The annotated gap. Only where both series have a value.
  const gapAt = gap && two ? Math.min(n - 1, Math.max(0, gap.at ?? n - 1)) : -1
  const gapVals =
    gapAt >= 0 && isNum(used[0].values[gapAt]) && isNum(used[1].values[gapAt])
      ? ([used[0].values[gapAt], used[1].values[gapAt]] as [number, number])
      : null
  // The bracket runs up from the lower line through the place its end label
  // sits. That label steps aside by the width of the bracket, or its panel
  // ground would cut the bracket in two just above the endpoint.
  if (gapVals && !stacked) {
    for (const b of blocks) {
      if (b.last === gapAt && b.over < Math.max(...gapVals)) b.inset = true
    }
  }

  // Where the gap label sits, top to bottom. Beside the bracket there is a
  // wedge of free panel between the two lines, and it narrows away from the
  // bracket, so a label that is centred on the bracket runs into the upper line
  // once the plot is narrow enough for the label to cover a third of it. The
  // free band is measured over the stretch the label would cover at a given
  // plot width, and the label is centred in that. Measured twice, for a phone
  // and for a desk; a container query in app/kit.css picks one.
  const gapRight = gapAt >= 0 && fx(gapAt) < 0.5
  const gapPlace = (plotPx: number): { top: number; fits: boolean } => {
    if (!gapVals || !gap) return { top: 0, fits: false }
    const mid = (fy(gapVals[0]) + fy(gapVals[1])) / 2
    const reach = (gap.label.length * 7.2 + 22) / plotPx
    const [x0, x1] = gapRight ? [fx(gapAt), fx(gapAt) + reach] : [fx(gapAt) - reach, fx(gapAt)]
    const hiK = gapVals[0] >= gapVals[1] ? 0 : 1
    const inReach = (k: number) =>
      used[k].values.filter((val, i): val is number => val !== null && fx(i) >= x0 && fx(i) <= x1)
    const floor = Math.max(gapVals[1 - hiK], ...inReach(1 - hiK))
    const ceil = Math.min(gapVals[hiK], ...inReach(hiK))
    // The lower series' end label sits just above its line at the right-hand
    // end. When the gap label reaches into that corner, the band starts above
    // the end label, not at the line.
    const low = fy(floor) - (x1 > 0.6 && !stacked ? LABEL_PX / height : 0)
    // Room for one line of text with air on both sides, or it does not fit.
    const fits = (low - fy(ceil)) * height >= 28
    return { top: fits ? (low + fy(ceil)) / 2 : mid, fits }
  }
  // Where the two lines run too close for the label to sit between them, it is
  // not squeezed in over a line or an end label: it moves up beside the
  // caption, and the bracket alone marks where the gap was measured.
  const gapNarrow = gapPlace(190)
  const gapWide = gapPlace(480)
  const gapInside = gapNarrow.fits && gapWide.fits

  const tipFor = (i: number) =>
    `${x[i]}: ` +
    used
      .map((s) => `${two ? `${s.name} ` : ""}${s.values[i] === null ? "no value" : format(s.values[i] as number)}`)
      .join("; ")

  const row = ticks
    .filter((t) => t.at >= 0 && t.at < n)
    .map((t) => ({ pos: fx(t.at), label: t.label, key: `t${t.at}` }))

  return (
    <figure className={`beta-chart beta-charts-line${two ? " beta-charts-line--two" : ""}`}>
      {gapVals && gap && !gapInside ? (
        <div className="beta-charts-head">
          <figcaption className="beta-chart__cap">{caption}</figcaption>
          <span className="beta-charts-head__note">{gap.label}</span>
        </div>
      ) : (
        <figcaption className="beta-chart__cap">{caption}</figcaption>
      )}
      {two && (
        <ul className="beta-charts-legend">
          {used.map((s) => (
            <li key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div className={`beta-charts-line__frame${stacked ? " is-stacked" : ""}`}>
        <div className="beta-charts-line__y" style={{ height }} aria-hidden="true">
          {yTicks.map((t) => (
            <span key={t}>{tickText(t)}</span>
          ))}
        </div>
        <div className="beta-charts-line__plot" style={{ height }} role="img" aria-label={summary}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {yTicks.map((t) => (
              <line
                key={t}
                x1={0}
                x2={100}
                y1={fy(t) * 100}
                y2={fy(t) * 100}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                // With values on both sides of it, zero is the line that
                // matters, so it takes the label ink instead of the grid's.
                style={{ stroke: t === 0 && bottom < 0 ? CHART_INK.label : CHART_INK.grid }}
              />
            ))}
            {x.map((label, i) => {
              // One hover column per point, edge to edge between midpoints.
              const left = i === 0 ? 0 : ((fx(i - 1) + fx(i)) / 2) * 100
              const right = i === n - 1 ? 100 : ((fx(i) + fx(i + 1)) / 2) * 100
              return (
                <g className="beta-charts-slot" key={`${label}-${i}`}>
                  <title>{tipFor(i)}</title>
                  <rect
                    className="beta-charts-hit"
                    x={n === 1 ? 0 : left}
                    y={0}
                    width={n === 1 ? 100 : right - left}
                    height={100}
                  />
                  <line
                    className="beta-charts-line__hair"
                    x1={fx(i) * 100}
                    x2={fx(i) * 100}
                    y1={0}
                    y2={100}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    style={{ stroke: CHART_INK.label }}
                  />
                </g>
              )
            })}
            {gapVals && (
              <line
                x1={fx(gapAt) * 100}
                x2={fx(gapAt) * 100}
                y1={fy(gapVals[0]) * 100}
                y2={fy(gapVals[1]) * 100}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                style={{ stroke: CHART_INK.value }}
              />
            )}
            {paths.map(
              (d, k) =>
                d && (
                  <path
                    key={used[k].name}
                    d={d}
                    fill="none"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ stroke: used[k].color }}
                  />
                ),
            )}
            {labels.map((l) => (
              <Dot
                key={l.name}
                x={fx(l.end.i) * 100}
                y={fy(l.end.value) * 100}
                size={8}
                ring={2}
                color={l.color}
              />
            ))}
          </svg>
          {blocks.map(({ block, over, last, inset }) => (
            <div
              key={block.map((b) => b.name).join("+")}
              className={`beta-charts-line__end${inset ? " is-inset" : ""}`}
              style={{ top: pct(fy(over)), right: pct(1 - fx(last)) }}
            >
              {block.map((b) => (
                <span className="beta-charts-lbl" key={b.name}>
                  {two && <i style={{ background: b.color }} />}
                  <b>{format(b.end.value)}</b>
                  {two && <span>{b.name}</span>}
                </span>
              ))}
            </div>
          ))}
          {gapVals && gap && gapInside && (
            <span
              className={`beta-charts-line__gap${gapRight ? " is-right" : ""}`}
              style={
                {
                  "--gap-narrow": pct(gapNarrow.top),
                  "--gap-wide": pct(gapWide.top),
                  left: pct(fx(gapAt)),
                } as CSSProperties
              }
            >
              {gap.label}
            </span>
          )}
        </div>
        <TickRow ticks={row} />
      </div>
      <DataTable
        caption={caption}
        head={["Point", ...used.map((s) => s.name)]}
        rows={x.map((label, i) => [
          label,
          ...used.map((s) => (s.values[i] === null ? "no value" : format(s.values[i] as number))),
        ])}
      />
    </figure>
  )
}

/* ===========================================================================
   TENURE BARS
   ======================================================================== */

export interface TenureRow {
  label: string
  /** Second line under the label: a title, a place. */
  sub?: string
  /** The calendar year it began in. */
  start: number
  /** The calendar year it ended in, or "present". Equal to `start` for a lone year. */
  end: number | "present"
}

/** An ISO day as a fractional year: 2026-02-23 is about 2026.146. */
function fractionalYear(iso: string): number {
  const t = dayMs(iso)
  if (!Number.isFinite(t)) return NaN
  const y = new Date(t).getUTCFullYear()
  const a = Date.UTC(y, 0, 1)
  return y + (t - a) / (Date.UTC(y + 1, 0, 1) - a)
}

/**
 * Spans on one shared time axis.
 *
 * Every row's track is the same width and the same years, so the eye can read
 * down a column and see what overlapped what. Bar length here is TIME, never
 * magnitude, which is why these bars take one flat shade and not the ramp: a
 * darker bar would claim something about the job that the data does not hold.
 *
 * HOW A YEAR BECOMES A BAR
 *
 * The source is year-resolution: "2018 to 2022", then "2022 to present". Each
 * end fell somewhere inside its year and nobody wrote down where. Drawing both
 * years whole would show 2022 twice, and a career of ordinary job changes
 * would read as year after year spent in two jobs at once, which the source
 * never said. So a span is drawn from the start of its first year to the START
 * of its last year: the year a thing ended in is the year its successor began
 * in, and the two bars meet on that gridline. A lone year ("2008") is drawn as
 * that whole year, because a bar of no width would say it never happened.
 * Each end is therefore right to within a year, which is what the source
 * claims. Two bars that do overlap now mean two things really ran together.
 *
 * "Present" is a date, not the wall clock. See `asOf`. Nothing is drawn past
 * it: a lone year that is the as-of year stops at the as-of date like an open
 * row does, because the source cannot vouch for months that had not happened.
 */
export function TenureBars({
  rows,
  caption,
  summary,
  asOf,
  from,
  tickEvery,
  emptyNote = "No data.",
}: {
  rows: TenureRow[]
  caption: string
  /** The takeaway, one sentence. Names the figure for assistive tech. */
  summary: string
  /** "YYYY-MM-DD": what "present" means. Open bars end here. */
  asOf: string
  /** First year on the axis. Defaults to the earliest start. */
  from?: number
  /** Years between gridlines. Default picks 1, 2, 5 or 10. */
  tickEvery?: number
  emptyNote?: string
}) {
  const now = fractionalYear(asOf)
  const dated = Number.isFinite(now)
  const valid = rows.filter(
    (r) => isNum(r.start) && (r.end === "present" ? dated : isNum(r.end)),
  )
  if (!valid.length) return <EmptyFigure caption={caption} note={emptyNote} />

  const stopOf = (r: TenureRow): number => {
    if (r.end === "present") return Math.max(now, r.start)
    const stop = r.end > r.start ? r.end : r.start + 1
    // Clamp to the as-of date. A row that STARTS after it is the caller's
    // contradiction to sort out; it is drawn as given and the axis grows.
    return dated && stop > now && r.start < now ? now : stop
  }
  const min = Math.min(isNum(from) ? from : Infinity, ...valid.map((r) => r.start))
  // The axis is never shorter than a year, or a role begun last month would
  // be a bar of full width on an axis with no scale.
  const max = Math.max(min + 1, ...valid.map(stopOf))
  const span = max - min
  const at = (year: number) => (year - min) / span

  const step = isNum(tickEvery) && tickEvery > 0 ? tickEvery : span <= 8 ? 1 : span <= 16 ? 2 : span <= 45 ? 5 : 10
  const lines: number[] = []
  for (let y = Math.ceil(min / step) * step; y < max; y += step) if (y > min) lines.push(y)

  // Axis labels. Every one sits where its date is: a year names its 1 January,
  // the same as the gridlines, and the as-of date sits AT the as-of date, which
  // is the right-hand edge only when nothing runs past it. The right-hand edge
  // gets a label of its own whenever it is not the as-of date. TickRow thins
  // the round years by width and never drops the as-of mark.
  const year = (y: number) => String(Math.round(y * 10) / 10)
  const endsNow = dated && valid.some((r) => stopOf(r) === now)
  const axis: AxisLabel[] = [
    { pos: 0, label: year(min), key: "min" },
    ...lines.map((y) => ({ pos: at(y), label: String(y), key: `y${y}` })),
  ]
  if (endsNow) {
    axis.push({
      pos: at(now),
      label: `${MONTHS[Number(asOf.slice(5, 7)) - 1] ?? ""} ${asOf.slice(0, 4)}`.trim(),
      key: "asof",
      mark: true,
    })
  }
  if (!endsNow || max > now) axis.push({ pos: 1, label: year(max), key: "max" })

  const yearsText = (r: TenureRow): string =>
    r.end === "present"
      ? `${r.start} to present`
      : r.end <= r.start
        ? String(r.start)
        : `${r.start} to ${r.end}`

  return (
    <figure className="beta-chart beta-charts-tenure" aria-label={summary}>
      <figcaption className="beta-chart__cap">{caption}</figcaption>
      <div className="beta-charts-tenure__rows" role="list">
        {valid.map((r, i) => {
          const left = at(r.start)
          const width = Math.max(at(stopOf(r)) - left, 0.006)
          return (
            <div className="beta-charts-tenure__row" role="listitem" key={`${r.label}-${r.start}-${i}`}>
              <span className="beta-charts-tenure__lbl">
                <b>{r.label}</b>
                {r.sub && <span>{r.sub}</span>}
              </span>
              <span className="beta-charts-tenure__when">{yearsText(r)}</span>
              <span className="beta-charts-tenure__track" aria-hidden="true">
                {lines.map((y) => (
                  <i key={y} style={{ left: pct(at(y)), background: CHART_INK.grid }} />
                ))}
                <span
                  className="beta-charts-tenure__bar"
                  style={{ left: pct(left), width: pct(width), background: SEQUENTIAL[3] }}
                />
              </span>
            </div>
          )
        })}
        <div className="beta-charts-tenure__row beta-charts-tenure__axis" aria-hidden="true">
          <TickRow ticks={axis} />
        </div>
      </div>
    </figure>
  )
}

/* ===========================================================================
   SHAPING HELPERS
   The primitives take plain arrays. These turn what the site's data files
   actually hold (daily counts, resume year strings) into those arrays, so each
   page does not write its own slightly different bucketing.
   ======================================================================== */

/**
 * Daily values summed into `weeks` consecutive seven-day buckets, the last of
 * which ends ON `end` ("YYYY-MM-DD", inclusive). Oldest first. Days missing
 * from the input count as zero; days outside the window are ignored.
 *
 * These are rolling weeks counted back from `end`, not ISO weeks: the newest
 * bucket is always a full seven days, never a part-week that reads as a drop.
 */
export function weekBuckets(days: DayDatum[], end: string, weeks: number): number[] {
  const t1 = dayMs(end)
  const n = Math.max(0, Math.floor(weeks))
  const out = new Array<number>(n).fill(0)
  if (!Number.isFinite(t1) || !n) return out
  const t0 = t1 - (n * 7 - 1) * DAY_MS
  for (const d of days) {
    const t = dayMs(d?.date)
    if (!Number.isFinite(t) || t < t0 || t > t1 || !isNum(d.value)) continue
    out[Math.min(n - 1, Math.floor((t - t0) / (7 * DAY_MS)))] += d.value
  }
  return out
}

/**
 * Daily values summed into calendar months: `months` of them, the last being
 * the month `end` falls in. Oldest first, labelled "YYYY-MM", ready for
 * BarStrip. The last month is partial unless `end` is a month end: say so.
 */
export function monthBuckets(days: DayDatum[], end: string, months: number): StripDatum[] {
  const y = Number(end.slice(0, 4))
  const m = Number(end.slice(5, 7)) - 1
  const n = Math.max(0, Math.floor(months))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !n) return []
  const sum = new Map<string, number>()
  for (let i = n - 1; i >= 0; i--) sum.set(new Date(Date.UTC(y, m - i, 1)).toISOString().slice(0, 7), 0)
  for (const d of days) {
    const k = d?.date?.slice(0, 7)
    if (k && sum.has(k) && isNum(d.value)) sum.set(k, (sum.get(k) ?? 0) + d.value)
  }
  return [...sum.entries()].map(([label, value]) => ({ label, value }))
}

/**
 * A resume-style year string as a TenureRow's `start` and `end`.
 *   "2018 to 2022"    { start: 2018, end: 2022 }
 *   "2008"            { start: 2008, end: 2008 }
 *   "2024 to present" { start: 2024, end: "present" }
 * A hyphen or an en dash is accepted in place of "to". Anything else is null,
 * so a typo in the source drops a row the caller can count, not a NaN bar.
 */
export function parseYears(text: string): Pick<TenureRow, "start" | "end"> | null {
  const m = /^(\d{4})(?:\s*(?:to|-|\u2013)\s*(\d{4}|present))?$/i.exec(text.trim())
  if (!m) return null
  const start = Number(m[1])
  const end = !m[2] ? start : /present/i.test(m[2]) ? "present" : Number(m[2])
  return { start, end }
}

export { CHART_INK }
