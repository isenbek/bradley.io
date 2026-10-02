import type { ReactNode } from "react"
import { CHART_INK, rampStep } from "@/lib/beta/chart-theme"

/**
 * SpanRows: named rows on one shared axis, each a bar from one point to another.
 *
 *   <SpanRows
 *     caption="Models flown, 8 March to 2 October 2026"
 *     summary="Ten models. Opus 5 wrote 35.6% of all output tokens."
 *     rows={[{ key: "opus-5", label: "opus-5", sub: "Proficient, 26 Jul to 2 Oct",
 *              value: "35.6%", from: 0.67, to: 1, weight: 1 }]}
 *     ticks={[{ pos: 0.11, label: "Apr" }]}
 *   />
 *
 * WHY IT EXISTS. app/_charts.tsx has TenureBars for exactly this picture, but
 * its axis is whole calendar years (a resume gives nothing finer), and the
 * pilot record is seven months of days. This is the same figure with the
 * positions handed in as fractions, so it serves two uses on /ai-pilot:
 *   a date span    from and to are days along the covered period (models,
 *                  missions): the bar says WHEN, the value column says how much
 *   a score        from is 0 and to is score / top (ratings): an ordinary
 *                  bar from zero, with the evidence for the score under its name
 *
 * It reuses the TenureBars layout rules in app/kit.css (beta-charts-tenure*)
 * rather than restating them, so both stack the same way under 40rem of their
 * own width: name, then sub-line with the value at its right, then the track.
 *
 * PROPS
 *   rows      SpanRow[]:
 *               key     unique
 *               label   the name, in full glass
 *               sub     one muted line under it: the evidence, the dates
 *               value   the right-hand figure, already formatted
 *               from,to 0 to 1 along the track. Clamped. A span thinner than
 *                       the minimum mark is drawn at the minimum, so one day
 *                       in seven months is still visible.
 *               weight  0 to 1: the row's magnitude as a share of the largest.
 *                       Shades the bar along the sequential ramp. It must say
 *                       the same thing the value column says in text, never a
 *                       second variable.
 *   caption   visible title: what, in what unit, over what period
 *   summary   the takeaway, one sentence; names the figure for a screen reader
 *   ticks     { pos: 0 to 1, label }[] under the tracks, with a hairline in
 *             every track at the same place. Keep them few and short: they are
 *             all shown at every width.
 *   emptyNote shown instead of the figure when there are no rows
 *
 * Every label, sub-line and value is real text in the DOM, so this is a
 * labelled list, not role="img", and needs no hidden table. The bar itself is
 * aria-hidden: it repeats what the text beside it says.
 *
 * PANEL ONLY, a sibling of .prose, colour from lib/beta/chart-theme.ts: the
 * rules at the top of app/_charts.tsx apply here unchanged. No client state.
 */

export interface SpanRow {
  key: string
  label: string
  sub?: ReactNode
  value: string
  from: number
  to: number
  weight: number
}

export interface SpanTick {
  pos: number
  label: string
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)
const pct = (f: number) => `${Math.round(f * 1_000_000) / 10_000}%`

export function SpanRows({
  rows,
  caption,
  summary,
  ticks = [],
  emptyNote = "No data.",
}: {
  rows: SpanRow[]
  caption: string
  summary: string
  ticks?: SpanTick[]
  emptyNote?: string
}) {
  if (!rows.length) {
    return (
      <figure className="beta-chart">
        <figcaption className="beta-chart__cap">{caption}</figcaption>
        <p className="quiet">{emptyNote}</p>
      </figure>
    )
  }

  const marks = ticks.filter((t) => t.pos >= 0 && t.pos <= 1)

  return (
    <figure className="beta-chart beta-charts-tenure beta-pilot-rows" aria-label={summary}>
      <figcaption className="beta-chart__cap">{caption}</figcaption>
      <div className="beta-charts-tenure__rows" role="list">
        {rows.map((r) => {
          const left = clamp(Math.min(r.from, r.to))
          const width = Math.max(clamp(Math.max(r.from, r.to)) - left, 0.006)
          return (
            <div className="beta-charts-tenure__row" role="listitem" key={r.key}>
              <span className="beta-charts-tenure__lbl">
                <b>{r.label}</b>
                {r.sub ? <span>{r.sub}</span> : null}
              </span>
              <span className="beta-charts-tenure__when beta-pilot-val">{r.value}</span>
              <span className="beta-charts-tenure__track" aria-hidden="true">
                {marks.map((t) =>
                  t.pos > 0 && t.pos < 1 ? (
                    <i key={t.label + t.pos} style={{ left: pct(t.pos), background: CHART_INK.grid }} />
                  ) : null,
                )}
                <span
                  className="beta-charts-tenure__bar"
                  style={{
                    // Hold the bar inside the track when a late, short span
                    // would be pushed past the right edge by its minimum width.
                    left: pct(Math.min(left, 1 - width)),
                    width: pct(width),
                    // Bars use the upper four steps of the ramp, as BarStrip
                    // does: the palest step is invisible as a thin mark.
                    background: rampStep(0.2 + 0.8 * clamp(r.weight)),
                  }}
                />
              </span>
            </div>
          )
        })}
        {marks.length > 0 && (
          <div className="beta-charts-tenure__row beta-charts-tenure__axis" aria-hidden="true">
            <div className="beta-charts-ticks">
              {marks.map((t) => (
                <span
                  key={t.label + t.pos}
                  className={t.pos <= 0.02 ? "is-start" : t.pos >= 0.98 ? "is-end" : undefined}
                  style={{ left: pct(t.pos) }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </figure>
  )
}
