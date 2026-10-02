import type { ReactNode } from "react"
import { BetaMeasured } from "@/app/_measured"

/**
 * One figure on /the-shift or /cost-analysis: a panel, and under it the chip
 * that says which file the figure was read from and what period it covers.
 *
 * The two travel as one block so a chip can never drift onto the next figure,
 * and so a reader who sees a number always finds its source directly under it.
 * The chip's text is one child, which keeps the mark beside the sentence when
 * the sentence wraps on a phone.
 *
 * `kind` is the claim the figure makes about itself, printed in the panel bar
 * by the caller and repeated here as a data attribute so the stylesheet can
 * draw a modelled figure differently from a recorded one. It is never colour
 * alone: the word is in the bar.
 */
export function ShiftFigure({
  children,
  source,
  note,
  kind,
  labels,
}: {
  /** The panel. */
  children: ReactNode
  /** The file the figure was read from. */
  source: string
  /** What the chip says after the file name: the period and the cut. */
  note: ReactNode
  kind?: "recorded" | "modelled" | "both"
  /**
   * For a RowChart whose row names are longer than the shared chart's 7rem
   * label column: "mid" fits a domain name, "long" fits a job title. On a
   * narrow screen the name moves to its own line above the bar.
   */
  labels?: "mid" | "long"
}) {
  return (
    <div className="beta-shift-fig" data-kind={kind} data-labels={labels}>
      {children}
      <BetaMeasured source={source}>
        <span>
          <b>{source}</b>
          {note}
        </span>
      </BetaMeasured>
    </div>
  )
}

/**
 * The word that says which side of the comparison a panel is on, for the
 * panel bar. A recorded figure and a modelled one must not be told apart by
 * colour or by line style alone.
 */
export function ShiftKind({ kind }: { kind: "recorded" | "modelled" }) {
  return (
    <span className="beta-shift-kind" data-kind={kind}>
      <i aria-hidden="true" />
      {kind}
    </span>
  )
}
