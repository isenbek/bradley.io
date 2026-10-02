"use client"

import { useNow } from "@/components/kit/InstrumentStatus"
import { readInstrument, toMs } from "@/lib/instrument-status"
import { useChanged } from "@/lib/use-changed"
import { ACTIVE_WINDOW_S, type NowId, type NowSnapshot } from "./types"
import { useLiveNow } from "./use-live-now"

/**
 * LiveDot: a small dot that is lit only while something is really happening.
 *
 *   <LiveDot />                         Claude Code is active on this host
 *   <LiveDot of="geiger" label />       the Geiger counter is live, with words
 *   <LiveDot initial={snapshot} />      with the server's snapshot to start from
 *
 * PROPS
 *   of        "activity" (default) or any NowId ("geiger", "bus", "cameras",
 *             "firewall", "fleet", "sdr").
 *             activity: lit when a Claude Code session is KNOWN to have written
 *             within the last five minutes (Pulse.lastActive, a lower bound, so
 *             the dot can be late to light and is never lit without proof).
 *             any other id: lit when that instrument is LIVE by its own row of
 *             FRESHNESS, on this browser's clock.
 *   label     also print the state in words beside the dot. Default false. The
 *             words are always present for a screen reader and as a tooltip.
 *             The words get longer after mount ("checking" becomes a
 *             sentence), so give a labelled dot a line of its own; the bare
 *             dot is a fixed 10px and moves nothing.
 *   initial   NowSnapshot | null, if the page has one. Without it the dot waits
 *             for the shared poll (useLiveNow), unlit.
 *   frozen    render `initial` and never poll. For specimens and tests.
 *
 * Also exported: useActive(of, initial?) -> { active, known, words }, for a
 * caller that wants the fact and not the dot (the wordmark's own i-dot, say).
 *
 * UNLIT IS THE DEFAULT, AND IT DOES NOT MOVE. No clock yet, no data yet, an
 * instrument offline, nobody at the keyboard: all the same quiet ring. There
 * is no idle animation, no breathing loop, nothing that runs because time
 * passed. The one motion is a single short ring when a NEW active minute is
 * recorded for Claude Code, which is a real event and happens at most once a
 * minute. The instrument dots do not ring at all.
 *
 * LEGIBLE WITHOUT COLOUR. Lit is a filled disc, unlit is a hollow ring, so the
 * state survives greyscale and forced colours. Blue is ACTIVE in this palette
 * and is used for nothing else here.
 *
 * GROUND. On paper the fill is the -ink blue (7.7:1). Inside a kit .panel it
 * switches to the panel blue by itself.
 *
 * SIZE. 10px (0.625rem), fixed, whatever text it sits beside, so a bare dot
 * never changes the height of its line. To change it, set the custom property
 * --beta-live-dot on the dot's parent (a length). The specimen page shows the
 * bare dot beside the masthead wordmark, a heading, body text and a panel bar.
 */

const NAMES: Record<NowId, string> = {
  activity: "Claude Code",
  firewall: "The edge firewall count",
  geiger: "The Geiger counter",
  bus: "The perception bus",
  cameras: "The camera",
  fleet: "The fleet collector",
  sdr: "The SDR control plane",
  build: "This build",
}

export interface Active {
  /** Lit: proved active, on this browser's clock. */
  active: boolean
  /** There is a clock and an answer, so `active: false` means "not seen", not "not asked". */
  known: boolean
  /** The state as a sentence fragment, true whenever it is read. */
  words: string
  /** Activity only: the last known active minute, ISO. Changes when a new one lands. */
  stamp: string | null
}

export function useActive(
  of: NowId = "activity",
  initial?: NowSnapshot | null,
  options?: { frozen?: boolean }
): Active {
  const { data } = useLiveNow(initial, options)
  const now = useNow()
  const name = NAMES[of]

  if (!data || now === null) {
    return { active: false, known: false, words: `${name}: checking`, stamp: null }
  }

  if (of === "activity") {
    const pulse = data.pulse
    const lastMs = toMs(pulse?.lastActive)
    const writtenMs = toMs(pulse?.generated)
    // Both halves matter: the last active minute is recent, AND the file that
    // says so is itself current. A cron that died mid-session must not leave
    // the dot lit on its last word.
    const active =
      lastMs != null &&
      writtenMs != null &&
      (now - lastMs) / 1000 <= ACTIVE_WINDOW_S &&
      (now - writtenMs) / 1000 <= ACTIVE_WINDOW_S
    return {
      active,
      known: pulse != null,
      words: active
        ? `${name} is active on this host now`
        : `${name}: no activity seen on this host in the last ${ACTIVE_WINDOW_S / 60} minutes`,
      stamp: active ? (pulse?.lastActive ?? null) : null,
    }
  }

  const row = data.rows?.find((r) => r.id === of)
  if (!row || row.status === "checking") {
    return { active: false, known: false, words: `${name}: checking`, stamp: null }
  }
  const state =
    row.freshness == null
      ? "live"
      : readInstrument(row.freshness, { lastHeardMs: toMs(row.lastHeard), error: row.error, now })
          .state
  return {
    active: state === "live",
    known: true,
    words: `${name} is ${state}`,
    // No ring for an instrument: its last-heard time moves on every poll, and
    // a ring every 15 s would be a loop by another name. Going from hollow to
    // filled is the whole signal.
    stamp: null,
  }
}

export function LiveDot({
  of = "activity",
  label = false,
  initial,
  frozen = false,
}: {
  of?: NowId
  label?: boolean
  initial?: NowSnapshot | null
  frozen?: boolean
}) {
  const { active, words, stamp } = useActive(of, initial, { frozen })
  // One ring per newly recorded active minute.
  const renewed = useChanged(stamp, 400)

  return (
    <span className="beta-live-dotwrap" title={words}>
      <span
        className={renewed && active ? "beta-live-dot beta-live-dot--tick" : "beta-live-dot"}
        data-active={active ? "true" : "false"}
        aria-hidden="true"
      />
      {label ? (
        <span className="beta-live-dotlabel">{words}</span>
      ) : (
        <span className="sr-only">{words}</span>
      )}
    </span>
  )
}
