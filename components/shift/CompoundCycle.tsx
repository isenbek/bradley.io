import type { ReactNode } from "react"

/**
 * The compound cycle from /the-shift: five steps, and the fifth feeds the
 * first.
 *
 * It is the kit's numbered sequence (.lesson and .step), on paper, because it
 * is an argument somebody wrote and not a measurement. The previous site drew
 * it as five circles joined by arrows in an SVG, which read well on a desk and
 * printed 6px labels on a phone. Here the steps are a real ordered list, the
 * arrows are drawn by the stylesheet between them, and the return from the
 * last step to the first is a rule under the row with its own caption, so the
 * loop is stated in words as well as drawn.
 *
 * Nothing in it moves. A cycle that animated would be a decorative loop, which
 * the kit rules out, and the claim is not that the loop is fast.
 */

export interface CycleStep {
  /** The step, as a short clause: "Sessions generate code". */
  title: string
  /** One or two plain sentences: what the step is here, with its number. */
  body: ReactNode
}

export function CompoundCycle({
  steps,
  returns,
}: {
  steps: CycleStep[]
  /** What the closing of the loop means, said in words. */
  returns: string
}) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    <div className="beta-shift-cycle">
      <ol className="lesson">
        {steps.map((s, i) => (
          <li className="step" key={s.title}>
            <span className="step-n" aria-hidden="true">
              {pad(i + 1)}
            </span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
      <p className="beta-shift-cycle__return">
        <span>
          {pad(steps.length)} feeds {pad(1)}
        </span>
        {returns}
      </p>
    </div>
  )
}
