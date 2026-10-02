/**
 * The shape of public/data/papers-data.json (written by
 * scripts/papers-pipeline.py) and the small vocabulary /papers puts on top of
 * it: status words, domain labels, and the text clean-up every string from the
 * source goes through. No React here, so the page, the card and the share card
 * can all read it.
 */

export interface ResultHighlight {
  label: string
  category: string
  cv: number
  events: number
  verdict: string
}

export interface Study {
  slug: string
  title: string
  description: string
  status: string
  author: string
  category: string
  createdAt: string
  hasPaper: boolean
  hasViz: boolean
  previewImage: string | null
  paperUrl: string | null
  dataFileCount: number
  /** Set by the pipeline from 2026-10-02; absent on an older papers-data.json. */
  withdrawn?: boolean
  /**
   * The study's own one-paragraph result. The source workspaces carry it
   * (findings_summary, on 11 of the 45 listed on 2026-10-02) but the pipeline
   * does not publish it yet. The card shows it the day the pipeline does, and
   * shows nothing until then: a finding is never written here by hand.
   */
  findingsSummary?: string
  resultsSummary?: {
    totalStreams: number
    clustered: number
    highlights: ResultHighlight[]
  }
}

/**
 * A note on a study's abstract, for the rare case where the abstract quotes a
 * number that the card's own results contradict at a glance. Written by hand,
 * so each one is held to two guards: it is shown only while the abstract still
 * contains `guard` verbatim, and only while the study it points at (`parent`)
 * is still listed. Change either at source and the note goes away by itself
 * rather than going stale.
 *
 * cross-domain-clustering: its abstract says the method was "proven on
 * earthquakes (CV=1.545)", while its results table gives Earthquakes M4+ at
 * 1.17. Both are right. 1.545 is the parent study's result on 118,009 M4.0+
 * earthquakes from 2021 to 2026 (terrapulse workspaces
 * earthquake-temporal-clustering/index.md and data/clustering_results.json,
 * overall_cv 1.5452); the atlas counted its own M4+ stream, 82,189 events
 * (cross-domain-clustering/index.md, results table). Read 2026-10-02.
 */
export interface AbstractNote {
  guard: string
  parent: string
  /** Text before the link to the parent study. */
  before: string
  /** Text after it. */
  after: string
}

export const ABSTRACT_NOTES: Record<string, AbstractNote> = {
  "cross-domain-clustering": {
    guard: "CV=1.545",
    parent: "earthquake-temporal-clustering",
    before: "The 1.545 above is the parent study’s result,",
    after:
      "measured on 118,009 M4.0+ earthquakes from 2021 to 2026. This atlas counted its own earthquake streams, so the M4+ figure in its key finding comes from a different set of events.",
  },
}

/** A figure the page has found in public/ and measured. */
export interface Figure {
  src: string
  /** Pixel size read from the file's own header; null when it could not be read. */
  width: number | null
  height: number | null
}

/**
 * What marks a study out for the wide card at the head of the grid: the page
 * has something of its own to show for it beyond the abstract. Today that is
 * the one study with its paper mirrored here and a published results table.
 */
export function hasResults(s: Study): boolean {
  return Boolean(s.resultsSummary && s.resultsSummary.highlights.length > 0)
}

export interface PapersData {
  generated: string
  totalStudies: number
  categories: Record<string, number>
  /** Studies the source project took off its own site. Absent on older data. */
  withdrawnCount?: number
  /** "omitted": not in `studies` at all. "listed": in `studies`, title only. */
  withdrawnPolicy?: string
  studies: Study[]
}

/* ---- Text ---------------------------------------------------------------- */

/**
 * Em dashes are banned in shipped text and the source is full of them, along
 * with their typewriter spellings. A title takes a colon; running text takes a
 * colon for a real dash and a comma for the double hyphen, which the source
 * uses mid-sentence ("not just oceans -- but the effect").
 *
 * Two pieces of the lab's internal vocabulary are also taken out, because they
 * mean nothing to a reader here:
 *   - a leading "PMA: " on a title. PMA is the paper-writing agent persona the
 *     pipeline already hides in the author field (AUTHOR_PUBLIC in
 *     scripts/papers-pipeline.py); one title still starts with it.
 *   - "#180"-style references to the lab's own issue tracker ("V2 re-run of
 *     #180 with ..." reads "V2 re-run with ...").
 * Both belong in the pipeline beside the author mapping; until they are done
 * there, they are done here, in one place.
 */
export const cleanTitle = (s: string): string =>
  s
    .replace(/^\s*PMA:\s*/, "")
    .replace(/\s*\u2014\s*|\s+--\s+/g, ": ")
    .trim()

export const cleanText = (s: string): string =>
  s
    .replace(/\s+of\s+#\d+\b/g, "")
    .replace(/\s*#\d+\b/g, "")
    .replace(/\s*\u2014\s*/g, ": ")
    .replace(/\s+--\s+/g, ", ")
    .replace(/\s*->\s*/g, " \u2192 ")
    .trim()

/** An abstract this short is shown whole, however many sentences it has. */
const WHOLE_MAX = 240
/** A remainder shorter than this is not worth a control: the abstract stays whole. */
const REST_MIN = 120

/**
 * An abstract as a lead and a remainder. Short abstracts are shown whole. A
 * long one shows its opening sentences on the card and keeps the rest behind
 * the card's "more" control, so the text is in the page once, never clipped by
 * CSS and never repeated for a screen reader.
 *
 * A control that opens onto one short sentence is more chrome than content, so
 * an abstract is only split when what it would hide is REST_MIN characters or
 * more. On 2026-10-02 that was 2 of 45.
 *
 * Sentences end at . ? or ! followed by a space and a capital, a digit or an
 * opening bracket, which leaves "CV=1.545" and "12.6M" alone.
 */
export function splitAbstract(raw: string): { lead: string; rest: string[] } {
  const paras = raw
    .split(/\n{2,}/)
    .map((p) => cleanText(p.replace(/\s+/g, " ")))
    .filter(Boolean)
  if (paras.length === 0) return { lead: "", rest: [] }

  const whole = paras.join(" ")
  if (whole.length <= WHOLE_MAX) return { lead: whole, rest: [] }

  const [first, ...others] = paras
  const sentences = first.split(/(?<=[.?!])\s+(?=[A-Z0-9(])/)
  let lead = ""
  let i = 0
  while (i < sentences.length && (lead.length < 110 || i === 0)) {
    lead = lead ? `${lead} ${sentences[i]}` : sentences[i]
    i++
  }
  const rest = [sentences.slice(i).join(" "), ...others].filter(Boolean)
  const hidden = rest.reduce((n, p) => n + p.length, 0)
  if (hidden < REST_MIN) return { lead: whole, rest: [] }
  return { lead, rest }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-09-26T..." to "Sep 2026". Sliced, never parsed: no timezone to drift. */
export function monthYear(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})/.exec(iso ?? "")
  if (!m) return null
  const name = MONTHS[Number(m[2]) - 1]
  return name ? `${name} ${m[1]}` : null
}

/** "2026-10-02T16:10..." to "Oct 2, 2026". Sliced for the same reason. */
export function dayMonthYear(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "")
  if (!m) return null
  const name = MONTHS[Number(m[2]) - 1]
  return name ? `${name} ${Number(m[3])}, ${m[1]}` : null
}

/* ---- Domains ------------------------------------------------------------- */

/**
 * The seven ids categorize_workspace() in the pipeline can return. "research"
 * is its fall-through: no keyword matched. It is labelled for what it is.
 */
const DOMAIN_LABEL: Record<string, string> = {
  seismology: "Seismology",
  "space-weather": "Space weather",
  climate: "Climate",
  "cross-domain": "Cross-domain",
  radiation: "Radiation",
  hydrology: "Hydrology",
  research: "Other",
}

/** The pipeline's fall-through id. Sorted last wherever domains are listed. */
export const DOMAIN_FALLBACK = "research"

export function domainLabel(id: string): string {
  if (Object.prototype.hasOwnProperty.call(DOMAIN_LABEL, id)) return DOMAIN_LABEL[id]
  // A domain this page was not told about: print its id, readably, not a guess.
  const words = id.replace(/[-_]+/g, " ").trim()
  return words ? words[0].toUpperCase() + words.slice(1) : "Unlabelled"
}

/* ---- Status -------------------------------------------------------------- */

/**
 * How a status is drawn. Three states and NO colour:
 *
 *   done   the lab's own end states. A solid ink tag.
 *   open   work in flight, drafts included. The plain outlined tag.
 *   none   withdrawn, or a word this page was not told about. The plain tag.
 *
 * Why no colour. Orange is ATTENTION in this palette: something is stale,
 * offline, or needs a human. A draft needs nothing from the reader, and with
 * most of the index in draft an orange tag put a warning on nearly every card.
 * Green for finished is the "green means good" the palette rules out. Red is a
 * failed assertion, and a withdrawn study is a decision that was taken, not an
 * assertion that failed. So the WORD carries the state, and the one visual
 * step (solid against outlined) survives greyscale and forced colours.
 *
 * History: before 2026-10-02 "withdrawn" rendered red and "withdrawn-permanent"
 * fell through to orange; from 2026-10-02 drafts were orange. All three were
 * wrong for the reasons above.
 */
export type StatusKind = "done" | "open" | "none"
export interface StatusTag {
  kind: StatusKind
  label: string
}

const DONE = "done" as const
const OPEN = "open" as const
const NONE = "none" as const

/**
 * Every status the pipeline can emit, mapped on purpose. The first block is
 * the pipeline's public vocabulary (STATUS_PUBLIC in scripts/papers-pipeline.py).
 * The second is the raw strings an older papers-data.json still carries, so the
 * page reads correctly on either file. The label is what is shown: a raw
 * workflow string is never printed. That makes "in review" and "in revision"
 * this site's words for the lab's raw workflow strings, not the lab's own
 * words, which is why the page says a card carries a note's status "in the
 * lab's own workflow" and not "the lab's own status word".
 */
const STATUS: Record<string, StatusTag> = {
  draft: { kind: OPEN, label: "draft" },
  active: { kind: OPEN, label: "active" },
  "in review": { kind: OPEN, label: "in review" },
  "in revision": { kind: OPEN, label: "in revision" },
  complete: { kind: DONE, label: "complete" },
  accepted: { kind: DONE, label: "accepted" },
  published: { kind: DONE, label: "published" },
  withdrawn: { kind: NONE, label: "withdrawn" },
  unknown: { kind: NONE, label: "status unknown" },

  "withdrawn-permanent": { kind: NONE, label: "withdrawn" },
  "revision-in-progress": { kind: OPEN, label: "in revision" },
  "draft-complete-pending-audit": { kind: OPEN, label: "in review" },
  "draft-complete-pending-hed-dek": { kind: OPEN, label: "in review" },
}

export function statusTag(status: string | null | undefined): StatusTag {
  const s = (status ?? "").trim().toLowerCase()
  // Own keys only: a status of "constructor" must not find Object.prototype.
  if (Object.prototype.hasOwnProperty.call(STATUS, s)) return STATUS[s]
  // Any other withdrawn-* variant is still withdrawn, and still neutral.
  if (s.startsWith("withdrawn")) return { kind: NONE, label: "withdrawn" }
  // The tenth raw string: a draft rewritten and waiting on another review round.
  if (s.startsWith("rewritten")) return { kind: OPEN, label: "in review" }
  // Anything this page was not told about gets no emphasis and no guess.
  return { kind: NONE, label: "status unknown" }
}

/** The order statuses are counted in: furthest along first. */
export const STATUS_ORDER = [
  "published",
  "accepted",
  "complete",
  "in review",
  "in revision",
  "active",
  "draft",
  "withdrawn",
  "status unknown",
]

/**
 * Withdrawn at source: the project that produced the study took it off its own
 * site. Such a study is never shown as a card, whatever the data file carries.
 * The pipeline already withholds those (WITHDRAWN_POLICY in
 * scripts/papers-pipeline.py); the status test is here so that an older
 * papers-data.json, which still lists them with figures, renders the same way.
 */
export function isWithdrawn(s: Study): boolean {
  return s.withdrawn === true || statusTag(s.status).label === "withdrawn"
}

/**
 * Authors are normalised by the pipeline to a small public vocabulary
 * (AUTHOR_PUBLIC there). These two are its labels for work credited to an AI
 * agent. The page states how many notes carry one of them; it prints no names.
 */
const AGENT_AUTHORS = new Set(["automated research agent", "claude"])
export const isAgentAuthored = (s: Study): boolean =>
  AGENT_AUTHORS.has((s.author ?? "").trim().toLowerCase())

/** A domain id is used in an element id and a CSS selector: letters, digits, hyphens. */
export const isSafeId = (id: string): boolean => /^[a-z0-9][a-z0-9-]*$/.test(id)
