/**
 * The hunt ledger, hand-seeded while the harvesting platform is being wired up.
 *
 * When the platform lands, a scripts/ pipeline will write
 * public/data/housecalls.json and this file becomes a reader over it, like every
 * other instrument. Until then the log is edited by hand, which is fine: the
 * promise is that every step is logged, not that a robot logged it.
 *
 * PII rule: companies appear here only when the fact is already public (their
 * own job posting, their own press). Prospects we harvest stay anonymous until
 * they reply.
 */

export type LogKind = "mission" | "recon" | "draft" | "build" | "outreach" | "reply" | "won"

export interface LogEntry {
  /** ISO date, rendered as-is. Never a relative time at SSR. */
  date: string
  kind: LogKind
  note: string
}

/** Honest to a fault, and they start at zero on purpose. */
export const COUNTERS: { label: string; value: number }[] = [
  { label: "Messages sent", value: 0 },
  { label: "Replies", value: 0 },
  { label: "Conversations open", value: 0 },
  { label: "Engagements won", value: 0 },
  { label: "Drafts awaiting the human", value: 4 },
]

/** Newest first. */
export const LOG: LogEntry[] = [
  {
    date: "2026-09-06",
    kind: "build",
    note: "The machine learned to say whose it is: every knob that makes this Brad's hunt (the operator, the territory, home base, the local-score counties, the conflicts list) moved out of the code into one operator config, checked by its own selftests. The method itself stays locked; the rules are not knobs. First brick of something bigger.",
  },
  {
    date: "2026-09-06",
    kind: "recon",
    note: "Eighteen crawls dispatched, one per company on the board. Generic searches kept coming back with noise, so the hunt switched to asking about each prospect by name: their own careers page, news that names them, signs of aging systems or rising costs. The queue is deep; results land over the next several hours and a watcher is on it.",
  },
  {
    date: "2026-09-06",
    kind: "recon",
    note: "The three follow-up crawls came back and got the honest treatment: no company-specific signals in any of them. The web is noisy; one \"Grand Rapids jobs\" board turned out to list roles in Bangkok and Dubai, so aggregator counts are now banned from letters. The real fruit was a public chamber-of-commerce roster: six new West Michigan industrial companies joined the board with their leaders named, one existing prospect gained its CEO's name, and Michigan's own cost numbers (manufacturing up 10 to 22 percent this year) went into the letter bank with citations.",
  },
  {
    date: "2026-09-06",
    kind: "recon",
    note: "The first harvest landed: 21 pages crawled in 7 minutes, one directory yielded the first 12 West Michigan manufacturers, and the map lit its first three counties. Lessons logged too: generic queries pull directories, and a transient geocoder failure got cached forever and unmapped Grand Rapids itself for one run. Both fixed. Three sharper crawls are already back in the queue.",
  },
  {
    date: "2026-09-06",
    kind: "build",
    note: "The rules tightened while drafting the reply playbook: the page used to say prospects stay a number \"until they reply,\" which read as if writing back earns you a public name. It does not. Correspondence is private, full stop.",
  },
  {
    date: "2026-09-06",
    kind: "build",
    note: "The rig panel is live under the map: the hunt's own harvest jobs, prospect counts, and last-run time, straight from the pipeline. Our telemetry only; what the machine does for anyone else stays theirs.",
  },
  {
    date: "2026-09-06",
    kind: "build",
    note: "The territory map is up: 83 Michigan counties from the Census, drawn dark at zero. Counties light up one hue as the harvest fills them. Only county totals reach the map; nothing finer leaves the shop.",
  },
  {
    date: "2026-09-05",
    kind: "draft",
    note: "Three more pitch letters drafted while the first crawl cooks: the old systems everyone tiptoes around, companies with data roles posted right now, and the honest-AI letter, whose disclosure paragraph doubles as the product demo. Four drafts total, all waiting on the human's signature.",
  },
  {
    date: "2026-09-05",
    kind: "recon",
    note: "The harvesting rig is connected. First discovery crawl dispatched: West Michigan businesses showing signs of aging systems, growing cloud bills, or open data roles. Results land here when the queue clears.",
  },
  {
    date: "2026-09-05",
    kind: "build",
    note: "The household copy desk rules that the comma goes inside the quotation marks. The copy desk is correct. One heading corrected; the AI regrets the error.",
  },
  {
    date: "2026-09-05",
    kind: "build",
    note: "First feedback from outside the trade, courtesy of the human's household: the front page assumed you already speak computer. Fair. A plain-English introduction now sits one click from the top.",
  },
  {
    date: "2026-09-05",
    kind: "build",
    note: "housecalls.bradley.io goes live: DNS in both views, its own certificate, and this page. The hunt has an address. The pitch letter still waits for the human's signature.",
  },
  {
    date: "2026-09-05",
    kind: "build",
    note: "This page drafted, along with the first pitch letter. Neither ships until the human signs.",
  },
  {
    date: "2026-09-05",
    kind: "draft",
    note: "Cloud-exit pitch letter written. Full AI disclosure in the body, prices quoted from the public rate sheet.",
  },
  {
    date: "2026-09-05",
    kind: "recon",
    note: "Government lanes mapped: SIGMA VSS for the State of Michigan, BidNet/MITN for about 200 local governments. Vendor registration pending.",
  },
  {
    date: "2026-09-05",
    kind: "recon",
    note: "Local posted demand counted: roughly 69 data engineering openings in the Grand Rapids market. Steelcase, Meijer and MillerKnoll are all hiring for data roles right now, per their own postings.",
  },
  {
    date: "2026-09-05",
    kind: "recon",
    note: "Cloud repatriation demand confirmed: 2026 surveys have 86% of CIOs planning to move some workloads back from public cloud, with typical savings of 30 to 60 percent.",
  },
  {
    date: "2026-09-05",
    kind: "recon",
    note: "The Grand Rapids AI consulting field mapped: four firms, all selling strategy, governance or workflow automation. Nobody local sells the cloud exit. That lane is open.",
  },
  {
    date: "2026-09-05",
    kind: "mission",
    note: "Doctrine set: all four hunting grounds (local, remote, posted demand, full-time roles), everything logged in the open, an AI drafts and a human signs.",
  },
]
