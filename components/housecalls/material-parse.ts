/**
 * The material list parser (selftested in
 * scripts/housecalls-quote-selftest.mjs): rambling truck-speech in, a
 * clean list out. Deliberately DETERMINISTIC RULES, not a model, and the
 * page says so: "you do not need AI for this" is the honest-AI letter's
 * most valuable sentence, demonstrated. The speech-to-text step is the
 * browser's; everything after it happens right here, offline, the same
 * way every time.
 */

const NUM_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  couple: 2, dozen: 12,
}

const FRACTIONS: [RegExp, string][] = [
  [/\bthree[- ]quarters?\b/g, "3/4"],
  [/\bthree[- ]eighths?\b/g, "3/8"],
  [/\bfive[- ]eighths?\b/g, "5/8"],
  [/\bseven[- ]eighths?\b/g, "7/8"],
  [/\bone[- ]quarter\b/g, "1/4"],
  [/\ba quarter\b/g, "1/4"],
  [/\bquarter\b/g, "1/4"],
  [/\bone[- ]half\b/g, "1/2"],
  [/\bhalf inch\b/g, "1/2 inch"],
  [/\bhalf\b/g, "1/2"],
  [/\bone and 1\/2\b/g, "1-1/2"],
  [/\btwo and 1\/2\b/g, "2-1/2"],
]

const UNITS = new Set([
  "foot", "feet", "ft", "box", "boxes", "roll", "rolls", "stick", "sticks",
  "piece", "pieces", "bag", "bags", "gallon", "gallons", "sheet", "sheets",
  "yard", "yards", "tube", "tubes", "length", "lengths", "spool", "spools",
  "bundle", "bundles", "case", "cases",
])
const UNIT_CANON: Record<string, string> = {
  foot: "ft", feet: "ft", boxes: "box", rolls: "roll", sticks: "stick",
  pieces: "pc", piece: "pc", bags: "bag", gallons: "gal", gallon: "gal",
  sheets: "sheet", yards: "yd", yard: "yd", tubes: "tube",
  lengths: "length", spools: "spool", bundles: "bundle", cases: "case",
}

const ACRONYMS: Record<string, string> = {
  emt: "EMT", pvc: "PVC", gfci: "GFCI", afci: "AFCI", nm: "NM", mc: "MC",
  thhn: "THHN", uf: "UF", pex: "PEX", cpvc: "CPVC", abs: "ABS", osb: "OSB",
  mdf: "MDF", hvac: "HVAC", awg: "AWG", led: "LED",
}

const FILLER =
  /\b(uh+|um+|erm|like|you know|please|i need|i'll need|we need|we'll need|get me|grab me|grab|pick up|lets get|let's get|gimme|give me|also|then|okay|ok|so)\b/g

// Wire pairings: "twelve two" after romex/wire/nm/mc reads as 12-2.
const WIRE_WORD = /\b(romex|wire|nm|mc|cable)\b/

export interface MaterialItem {
  qty: number
  unit: string | null
  desc: string
}

function wordsToNumbers(s: string): string {
  // Phrases first, so "a dozen" cannot become "1 12".
  s = s
    .replace(/\bhalf a dozen\b/g, "6")
    .replace(/\ba dozen\b/g, "12")
    .replace(/\ba couple( of)?\b/g, "2")
  // "twenty five" -> 25 (tens + unit), then bare number words.
  s = s.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[- ](one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_, t, u) => String(NUM_WORDS[t] + NUM_WORDS[u])
  )
  return s.replace(/\b[a-z]+\b/g, (w) => (w in NUM_WORDS ? String(NUM_WORDS[w]) : w))
}

function polish(desc: string): string {
  const words = desc.split(/\s+/).filter(Boolean)
  const out = words.map((w) => ACRONYMS[w] ?? w)
  // "12 2 ROMEX"/"ROMEX 12 2" wire pairs join as 12-2.
  const joined = out.join(" ")
  const paired = WIRE_WORD.test(desc)
    ? joined.replace(/\b(6|8|10|12|14)\s+(2|3|4)\b/, "$1-$2")
    : joined
  // sizes read like the trade writes them: 3/4 inch -> 3/4"
  return paired
    .replace(/\b(\d(?:-\d)?\/?\d*)\s*inch(es)?\b/g, '$1"')
    .replace(/\s+/g, " ")
    .trim()
}

/** One spoken chunk -> one item. Returns null for empty noise. */
export function parseChunk(chunk: string): MaterialItem | null {
  let s = chunk.toLowerCase().replace(FILLER, " ")
  for (const [re, sub] of FRACTIONS) s = s.replace(re, sub)
  s = wordsToNumbers(s)
  s = s.replace(/\s+/g, " ").trim()
  if (!s) return null

  let qty = 1
  let unit: string | null = null

  // Leading "N" then optional unit then optional "of".
  const m = s.match(/^(\d+(?:\.\d+)?)\s+(?:(\S+)\s+)?(?:of\s+)?(.+)$/)
  if (m) {
    const maybeUnit = m[2]?.toLowerCase()
    if (maybeUnit && UNITS.has(maybeUnit)) {
      qty = Number(m[1])
      unit = UNIT_CANON[maybeUnit] ?? maybeUnit
      s = m[3]
    } else if (m[2] !== undefined) {
      qty = Number(m[1])
      s = `${m[2]} ${m[3]}`
    } else {
      qty = Number(m[1])
      s = m[3]
    }
  }
  const desc = polish(s)
  if (!desc) return null
  return { qty, unit, desc }
}

/** The whole transcript -> items. Chunks split on connectors and pauses. */
export function parseTranscript(t: string): MaterialItem[] {
  return t
    .split(/(?:\band\b|\bthen\b|\balso\b|\bplus\b|,|;|\n|\.\s)/i)
    .map(parseChunk)
    .filter((x): x is MaterialItem => x !== null)
}

export function itemLine(it: MaterialItem): string {
  return `${it.qty}${it.unit ? ` ${it.unit}` : "x"} ${it.desc}`
}

export function listAsText(job: string, items: MaterialItem[]): string {
  const lines = [`MATERIAL LIST${job.trim() ? ` · ${job.trim()}` : ""}`, ""]
  for (const it of items) lines.push(itemLine(it))
  lines.push("", "made with the free pad at housecalls.bradley.io")
  return lines.join("\n")
}
