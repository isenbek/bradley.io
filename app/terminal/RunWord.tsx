"use client"

/**
 * A command named in the paper under the monitor, as a button that runs it in
 * the terminal above. The terminal listens for RUN_EVENT on window and treats
 * it exactly like a tap on a soft key: it runs the command and brings the
 * monitor into view. Before the terminal has hydrated nothing is listening,
 * and the button does nothing, which is what a static word would have done.
 */

export const RUN_EVENT = "term:run"

export function RunWord({ c }: { c: string }) {
  return (
    <button
      type="button"
      className="term-run"
      title={`Run ${c} in the terminal`}
      onClick={() => window.dispatchEvent(new CustomEvent(RUN_EVENT, { detail: c }))}
    >
      <code>{c}</code>
    </button>
  )
}
