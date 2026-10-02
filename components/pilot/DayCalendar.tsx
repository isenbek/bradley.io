import { CHART_INK, SEQUENTIAL, SEQUENTIAL_EMPTY } from "@/lib/beta/chart-theme"

/**
 * DayCalendar: the whole record on a calendar that fills its panel, with each
 * calendar week's total standing over its own column.
 *
 *   <DayCalendar
 *     caption="Transcript records per day and per week, 8 March to 2 October 2026"
 *     summary="1,095,113 transcript records on 187 days ..."
 *     unit="records"
 *     cellIs="one UTC day"
 *     days={[{ date: "2026-03-08", value: 80 }, ...]}
 *     start="2026-03-08" end="2026-10-02"
 *     mark={{ date: "2026-09-25", label: "busiest day" }}
 *     split={{ date: "2026-07-07", before: "...", after: "..." }}
 *   />
 *
 * WHY IT EXISTS. CalendarHeat (app/_charts.tsx) draws at natural size, an
 * 11px cell, because its text lives in the SVG and must not scale. That is
 * right in a card and too small as the centre of a page: seven months sat in
 * half a panel. This is the same chart built from HTML boxes on a CSS grid, so
 * the cells grow with the panel and every word stays at the kit's own size.
 * It follows CalendarHeat's rules where they apply:
 *   weeks are columns, rows run Monday to Sunday, months are named on top
 *   shades are quantile bins of the non-zero days, and the key prints the
 *     value range of every shade
 *   on a narrow screen it scrolls sideways in its own box, opened at the
 *     newest week (a right-to-left scroller holding a left-to-right grid);
 *     the weekday names stay put at the left edge while it does
 *   a visually hidden table by month carries the numbers
 *
 * WHAT IT ADDS.
 *   Week totals. One bar per column, the sum of the seven cells under it, so
 *     "busiest week" and the days that made it are the same picture. Calendar
 *     weeks, Monday to Sunday; the first and last are part weeks when the
 *     period starts or ends mid-week, and the tooltip says which days.
 *   mark    one day drawn with a ring, named in the key. A ring, not a colour:
 *           it reads in greyscale.
 *   split   a date that divides the period in two, drawn as two labelled
 *           brackets under the grid. The boundary is the week column holding
 *           the date, so it is right to within the week.
 *
 * PROPS
 *   days      { date: "YYYY-MM-DD", value }[]. Missing days are zero.
 *   start,end the window, "YYYY-MM-DD". Default: first and last date in days.
 *             Meant for up to about a year; it does not truncate.
 *   caption   visible title: what, in what unit, over what period
 *   summary   the takeaway in one sentence; the aria-label of the picture
 *   unit      plural noun for the count: "records"
 *   cellIs    what one cell is: "one UTC day"
 *   mark      { date, label }, optional
 *   split     { date, before, after }, optional
 *
 * PANEL ONLY, a sibling of .prose. Colour from lib/beta/chart-theme.ts. No
 * client state: the only motion is the 90ms outline under the reader's own
 * pointer.
 */

export interface CalDay {
  date: string
  value: number
}

const DAY_MS = 86_400_000
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const nf = (n: number): string => n.toLocaleString("en-US")

/** UTC midnight of an ISO day, by slicing: never the local zone. */
function dayMs(iso: string | undefined): number {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return NaN
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
}
const isoDay = (t: number): string => new Date(t).toISOString().slice(0, 10)
/** "24 Aug" */
const dayMonth = (t: number): string => `${new Date(t).getUTCDate()} ${MONTHS[new Date(t).getUTCMonth()]}`
/** Row for a day, Monday first. */
const weekRow = (t: number): number => (new Date(t).getUTCDay() + 6) % 7

/**
 * Up to five bins by quantile of the non-zero days, as CalendarHeat does and
 * for the same reason: one enormous day must not flatten the rest.
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

/** Week bars use the upper four steps: the palest is invisible as a thin bar. */
const barShade = (share: number): string =>
  SEQUENTIAL[Math.min(SEQUENTIAL.length - 1, 1 + Math.floor(share * (SEQUENTIAL.length - 1)))]

export function DayCalendar({
  days,
  caption,
  summary,
  unit = "",
  start,
  end,
  cellIs = "one day",
  mark,
  split,
  emptyNote = "No data.",
}: {
  days: CalDay[]
  caption: string
  summary: string
  unit?: string
  start?: string
  end?: string
  cellIs?: string
  mark?: { date: string; label: string }
  split?: { date: string; before: string; after: string }
  emptyNote?: string
}) {
  const byDay = new Map<number, number>()
  for (const d of days) {
    const t = dayMs(d?.date)
    if (!Number.isFinite(t)) continue
    const v = typeof d.value === "number" && Number.isFinite(d.value) && d.value > 0 ? d.value : 0
    byDay.set(t, (byDay.get(t) ?? 0) + v)
  }
  const seen = [...byDay.keys()]
  let t0 = dayMs(start)
  if (!Number.isFinite(t0)) t0 = seen.length ? Math.min(...seen) : NaN
  let t1 = dayMs(end)
  if (!Number.isFinite(t1)) t1 = seen.length ? Math.max(...seen) : NaN
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 < t0) {
    return (
      <figure className="beta-chart">
        <figcaption className="beta-chart__cap">{caption}</figcaption>
        <p className="quiet">{emptyNote}</p>
      </figure>
    )
  }

  const firstMonday = t0 - weekRow(t0) * DAY_MS
  const lastMonday = t1 - weekRow(t1) * DAY_MS
  const weeks = Math.round((lastMonday - firstMonday) / (7 * DAY_MS)) + 1
  const colOf = (t: number): number => Math.round((t - weekRow(t) * DAY_MS - firstMonday) / (7 * DAY_MS))

  const cells: { t: number; col: number; row: number; value: number }[] = []
  const weekTotals: number[] = Array.from({ length: weeks }, () => 0)
  for (let t = t0; t <= t1; t += DAY_MS) {
    const value = byDay.get(t) ?? 0
    const col = colOf(t)
    cells.push({ t, col, row: weekRow(t), value })
    weekTotals[col] += value
  }
  const weekMax = Math.max(0, ...weekTotals)

  const nonZero = cells.filter((c) => c.value > 0).map((c) => c.value)
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

  // A month is named over the column that holds its first drawn day. A name
  // that would land within three columns of the one before is dropped, except
  // that the part month at the very start gives way to the first whole one.
  const monthLabels: { col: number; text: string }[] = []
  let prevMonth = -1
  for (const c of cells) {
    const m = new Date(c.t).getUTCMonth()
    if (m === prevMonth) continue
    prevMonth = m
    const last = monthLabels[monthLabels.length - 1]
    if (last && c.col - last.col < 3) {
      if (last.col === 0 && monthLabels.length === 1) monthLabels.pop()
      else continue
    }
    monthLabels.push({ col: c.col, text: MONTHS[m] })
  }

  const markT = dayMs(mark?.date)
  const splitT = dayMs(split?.date)
  const splitCol = split && Number.isFinite(splitT) && splitT > t0 && splitT <= t1 ? colOf(splitT) : -1

  // The table twin is by month: two hundred rows of days is not a usable table.
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
  /** The days of a week column that are inside the window, as "24 Aug to 30 Aug". */
  const weekSpan = (col: number): string => {
    const a = Math.max(t0, firstMonday + col * 7 * DAY_MS)
    const b = Math.min(t1, firstMonday + col * 7 * DAY_MS + 6 * DAY_MS)
    return a === b ? dayMonth(a) : `${dayMonth(a)} to ${dayMonth(b)}`
  }

  // Grid lines: column 1 is the weekday names, week w is column w + 2.
  // Row 1 week totals, row 2 month names, rows 3 to 9 the days, row 10 the split.
  return (
    <figure className="beta-chart beta-pilot-cal">
      <div className="beta-charts-head">
        <figcaption className="beta-chart__cap">{caption}</figcaption>
        <span className="beta-charts-head__note">
          {weekMax > 0 ? `tallest week ${nf(weekMax)}${noun}` : "nothing recorded in this window"}
        </span>
      </div>
      {/* Focusable because it can scroll: a keyboard reader needs to reach it
          to move it. It is the picture, so it carries the takeaway. */}
      <div className="beta-pilot-cal__scroll" role="img" aria-label={summary} tabIndex={0}>
        <div
          className="beta-pilot-cal__grid"
          style={{ gridTemplateColumns: `auto repeat(${weeks}, minmax(11px, 1fr))` }}
          aria-hidden="true"
        >
          {/* The label column's ground, the full height of the grid: while the
              weeks scroll under the sticky names, nothing shows between them. */}
          <span className="beta-pilot-cal__mask" style={{ gridColumn: 1, gridRow: "1 / -1" }} />
          <span className="beta-pilot-cal__side beta-pilot-cal__side--wk" style={{ gridRow: 1 }}>
            Week
          </span>
          {weekTotals.map((v, col) => (
            <span
              key={`w${col}`}
              className="beta-pilot-cal__wk"
              style={{ gridColumn: col + 2, gridRow: 1, borderColor: CHART_INK.grid }}
              title={`${weekSpan(col)}: ${nf(v)}${noun}`}
            >
              {v > 0 && (
                <i
                  style={{
                    height: `${Math.round((v / weekMax) * 10_000) / 100}%`,
                    background: barShade(v / weekMax),
                  }}
                />
              )}
            </span>
          ))}

          {monthLabels.map((m) => (
            <span
              key={`m${m.col}`}
              className="beta-pilot-cal__mo"
              style={{ gridColumn: `${m.col + 2} / span 3`, gridRow: 2 }}
            >
              {m.text}
            </span>
          ))}

          {[0, 2, 4].map((r) => (
            <span key={`d${r}`} className="beta-pilot-cal__side" style={{ gridRow: r + 3 }}>
              {WEEKDAYS[r]}
            </span>
          ))}
          {cells.map((c) => (
            <i
              key={c.t}
              className="beta-pilot-cal__day"
              data-mark={c.t === markT ? "" : undefined}
              style={{ gridColumn: c.col + 2, gridRow: c.row + 3, background: shadeOf(c.value) }}
              title={`${isoDay(c.t)} (${WEEKDAYS[c.row]}): ${nf(c.value)}${noun}${c.t === markT && mark ? `, ${mark.label}` : ""}`}
            />
          ))}

          {split && splitCol > 0 && (
            <>
              <span
                className="beta-pilot-cal__span"
                style={{ gridColumn: `2 / ${splitCol + 2}`, gridRow: 10, borderColor: CHART_INK.grid }}
              >
                {split.before}
              </span>
              <span
                className="beta-pilot-cal__span beta-pilot-cal__span--after"
                style={{ gridColumn: `${splitCol + 2} / -1`, gridRow: 10, borderColor: CHART_INK.label }}
              >
                {split.after}
              </span>
            </>
          )}
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
        {mark && Number.isFinite(markT) && (
          <span className="beta-pilot-cal__markkey">
            <i data-mark="" style={{ background: shadeOf(byDay.get(markT) ?? 0) }} />
            {mark.label}
          </span>
        )}
      </p>
      <div className="sr-only">
        <table>
          <caption>{caption}, by month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">{unit || "Total"}</th>
              <th scope="col">Active days</th>
              <th scope="col">Days in window</th>
            </tr>
          </thead>
          <tbody>
            {[...byMonth.entries()].map(([k, m]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td>{nf(m.total)}</td>
                <td>{m.active}</td>
                <td>{m.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
