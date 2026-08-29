import { SEQUENTIAL, SEQUENTIAL_EMPTY, CHART_INK, rampStep } from "@/lib/beta/chart-theme"

/**
 * Beta's charts. Server-rendered, no charting library, no client JavaScript.
 *
 * All of them are horizontal row charts, and that is a mobile decision before it
 * is an aesthetic one. A vertical bar chart puts its category labels on the x
 * axis, where at 320px they either rotate, truncate or collide; rows put the
 * label in its own column and let the plot take whatever is left. Every chart
 * here is legible at 320px without a scroll container.
 *
 * Each carries a direct label on every row, so identity and value are never
 * colour-alone and no hover layer is needed to read the chart. The <title>
 * element adds a native tooltip on top of that, which costs nothing and needs no
 * script.
 */

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
        {data.map((d) => {
          const share = d.value / max
          return (
            <div
              className="beta-chart__row"
              role="listitem"
              key={d.label}
              // A `title` attribute, not a <title> element: the latter is an SVG
              // thing and is invalid inside HTML. Both the label and the value
              // are already visible, so this is a convenience rather than the
              // only way to read the row.
              title={`${d.label}: ${d.display ?? d.value.toLocaleString()}`}
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
              <span className="beta-chart__val">{d.display ?? d.value.toLocaleString()}</span>
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
 * the density, which is the trade worth making here.
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
        {data.map((d) => (
          <i
            key={d.label}
            title={`${d.label}: ${d.value.toLocaleString()}`}
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

export { CHART_INK }
