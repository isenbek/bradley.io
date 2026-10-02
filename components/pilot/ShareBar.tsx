import { SEQUENTIAL, SEQUENTIAL_EMPTY } from "@/lib/beta/chart-theme"

/**
 * ShareBar: one whole, cut into its parts.
 *
 *   <ShareBar
 *     caption="Share of all tool calls, by tool"
 *     summary="Bash is 74% of all tool calls."
 *     parts={[{ label: "Bash", share: 0.7407, display: "74%" }, ...]}
 *     rest={{ label: "128 other tools", share: 0.045, display: "4%" }}
 *   />
 *
 * WHY IT EXISTS. RowChart answers "which is biggest" with one row per name.
 * When one part is three quarters of the whole, eleven of its twelve rows are
 * stubs and the chart is a list. This draws the whole as one bar, so the
 * proportion is the picture, and names the parts under it.
 *
 * PROPS
 *   parts    up to four named parts, LARGEST FIRST: { label, share, display }.
 *            share is 0 to 1 of the whole; display is the text to print for it.
 *            Shaded along the sequential ramp from the largest (full ocean)
 *            down, which is magnitude in one hue, the rule for these charts.
 *            More than four would reuse a shade; pass the rest as `rest`.
 *   rest     everything not named, as one part, drawn last in the empty shade.
 *   caption  visible title: what the whole is
 *   summary  the takeaway in one sentence, for a screen reader
 *
 * A part is never drawn narrower than 3px, so a one percent share is still a
 * mark. Names and figures are real text in a list under the bar; the bar is
 * aria-hidden because it repeats them.
 *
 * PANEL ONLY, a sibling of .prose. No client state.
 */

export interface SharePart {
  label: string
  share: number
  display: string
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

export function ShareBar({
  parts,
  rest,
  caption,
  summary,
}: {
  parts: SharePart[]
  rest?: SharePart
  caption: string
  summary: string
}) {
  const named = parts.slice(0, SEQUENTIAL.length - 1).map((p, i) => ({
    ...p,
    shade: SEQUENTIAL[SEQUENTIAL.length - 1 - i],
  }))
  const all = rest ? [...named, { ...rest, shade: SEQUENTIAL_EMPTY }] : named

  return (
    <figure className="beta-chart beta-pilot-share" aria-label={summary}>
      <figcaption className="beta-chart__cap">{caption}</figcaption>
      <div className="beta-pilot-share__bar" aria-hidden="true">
        {all.map((p) => (
          <i
            key={p.label}
            title={`${p.label}: ${p.display}`}
            style={{ flexGrow: Math.max(clamp(p.share), 0.0001), background: p.shade }}
          />
        ))}
      </div>
      <ul className="beta-pilot-share__key">
        {all.map((p) => (
          <li key={p.label}>
            <i style={{ background: p.shade }} aria-hidden="true" />
            <span>{p.label}</span>
            <b>{p.display}</b>
          </li>
        ))}
      </ul>
    </figure>
  )
}
