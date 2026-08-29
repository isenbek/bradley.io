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
  /** The file the numbers came out of. */
  source: string
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

  return (
    <p className="measured">
      {children ?? (
        <>
          <b>{source}</b>
          {when ? `, generated ${when}` : ", generation date not recorded"}
        </>
      )}
    </p>
  )
}
