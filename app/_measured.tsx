/**
 * The measured chip: which run produced the numbers above it.
 *
 * STYLE.md §7 is "numbers carry provenance or they do not appear", and §8 rule 8
 * says it again as "every number carries the run that produced it". The kit gives
 * this a component, `.measured`, whose mark is a ::before glyph so it never lands
 * in a copy-paste. This wrapper exists so the date formatting is written once
 * rather than at every call site.
 *
 * The UTC timeZone is not optional. `toLocaleDateString` defaults to the local
 * zone, and the pipelines stamp UTC, so without it a build that runs in the
 * evening dates its own output to the previous day.
 */
export function BetaMeasured({
  generated,
  source,
  children,
}: {
  /** ISO timestamp from the data file itself, not the build. */
  generated?: string
  /** The file the numbers came out of. Not needed when children say it. */
  source?: string
  children?: React.ReactNode
}) {
  const when = generated
    ? new Date(generated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : null

  // ONE child, and the row does not wrap. The kit's .measured is a flex row
  // that wraps its children as whole items, so a file name and a date given
  // as two nodes put the date on its own line at 320px, starting with a
  // comma. One span wraps like a sentence, with the date kept whole. (/papers
  // and the home page each carried a local copy to get this; they use this
  // one now.)
  return (
    <p className="measured beta-t-measured">
      <span>
        {children ?? (
          <>
            <b>{source}</b>,{" "}
            <span className="beta-t-nowrap">
              {when ? `generated ${when}` : "generation date not recorded"}
            </span>
          </>
        )}
      </span>
    </p>
  )
}
