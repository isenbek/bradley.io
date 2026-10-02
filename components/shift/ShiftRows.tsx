import { SEQUENTIAL } from "@/lib/beta/chart-theme"

/**
 * Rows on a FIXED scale, with the scale printed under them.
 *
 * The shared RowChart (app/_charts.tsx) scales every bar to its largest row,
 * which is right for "which is biggest?" and wrong for a score out of 100 or a
 * share of a whole: there, a row of 81 filled the whole track and a share of
 * 35% looked like 100%. This draws the same rows (same classes, same ramp, so
 * it sits beside a RowChart without a seam) against a ceiling the caller
 * states, and prints that ceiling as an axis so the reader can see what a full
 * track would mean.
 *
 * Three things it does that RowChart does not:
 *   - `max`: the value a full track stands for. A bar is value / max, nothing
 *     else. A nonzero value too small to draw gets a two-pixel mark, and the
 *     caller's note has to say so when it happens.
 *   - `axis`: tick labels, evenly spaced from zero to `max`, under the tracks.
 *   - `open` on a row: the part of a whole the source does not itemise. Drawn
 *     as a hatched outline with no ramp colour, so an unknown remainder never
 *     reads as a measured value.
 *
 * Shade follows the row's share of the LARGEST row (redundant with length
 * among the rows shown) and uses the upper four ramp steps only: the palest
 * step is invisible as a thin bar on the sunk track.
 *
 * Panel only, sibling of .prose, colour from lib/beta/chart-theme.ts, nothing
 * animates: the same rules as every chart in app/_charts.tsx. If RowChart ever
 * takes a `max`, the two domain charts can go back to it.
 */

export interface ShiftRow {
  label: string
  value: number
  /** The value as printed at the row's end: "81", "35%". */
  display: string
  /** A remainder the source does not break down. Hatched, not ramp-coloured. */
  open?: boolean
}

export function ShiftRows({
  data,
  max,
  axis,
  caption,
}: {
  data: ShiftRow[]
  /** What a full track stands for: 100 for a score or a percentage. */
  max: number
  /** Tick labels from zero to `max`, evenly spaced: ["0", "50", "100"]. */
  axis: string[]
  /** What is measured, in what unit, over what period. */
  caption: string
}) {
  const largest = Math.max(0, ...data.filter((d) => !d.open).map((d) => d.value))
  // Every row is its own grid, so the value column is only one width if every
  // printed value is. Figure spaces pad the short ones.
  const width = Math.max(0, ...data.map((d) => d.display.length))
  const pad = (s: string) => s.padStart(width, " ")

  const shade = (v: number): string => {
    if (!(largest > 0) || !(v > 0)) return SEQUENTIAL[1]
    const i = Math.min(SEQUENTIAL.length - 1, Math.floor((v / largest) * SEQUENTIAL.length))
    return SEQUENTIAL[Math.max(1, i)]
  }

  return (
    <div className="beta-chart beta-shift-rows">
      <div className="beta-chart__cap">{caption}</div>
      <div className="beta-chart__rows" role="list">
        {data.map((d, i) => {
          const share = max > 0 ? Math.min(1, Math.max(0, d.value / max)) : 0
          return (
            <div
              className="beta-chart__row"
              role="listitem"
              key={`${d.label}-${i}`}
              title={`${d.label}: ${d.display}`}
            >
              <span className="beta-chart__lbl">{d.label}</span>
              <span className="beta-chart__track">
                <span
                  className={d.open ? "beta-chart__fill beta-shift-rows__open" : "beta-chart__fill"}
                  style={{
                    width: `${Math.round(share * 1_000_000) / 10_000}%`,
                    // A nonzero value too small to draw still gets a mark.
                    minWidth: d.value > 0 ? 2 : 0,
                    ...(d.open ? {} : { background: shade(d.value) }),
                  }}
                />
              </span>
              <span className="beta-chart__val" style={{ minWidth: `${width}ch` }}>
                {pad(d.display)}
              </span>
            </div>
          )
        })}
        {axis.length > 1 && (
          <div className="beta-chart__row beta-shift-rows__axis" aria-hidden="true">
            <span className="beta-chart__lbl" />
            {/* Each tick sits at its own fraction of the track; the stylesheet
                centres it there, and holds the first and last inside the track. */}
            <span className="beta-shift-rows__ticks">
              {axis.map((t, i) => (
                <span key={`${t}-${i}`} style={{ left: `${(i / (axis.length - 1)) * 100}%` }}>
                  {t}
                </span>
              ))}
            </span>
            {/* Holds the value column open to the same width as the rows above. */}
            <span className="beta-chart__val beta-shift-rows__ghost" style={{ minWidth: `${width}ch` }}>
              {pad("")}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
