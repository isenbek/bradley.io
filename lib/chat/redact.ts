/**
 * A last line of defence on the chat's output, applied to the stream.
 *
 * The system prompt already tells the model never to name the private
 * platform or its services, and the material it is given never names them.
 * But a visitor can type a name into a question, and a model can echo a word
 * it was handed. So before any text leaves the server, these names are
 * replaced, whatever produced them.
 *
 * Streaming makes this a buffer problem: a name can arrive split across two
 * deltas. The redactor holds back the tail of what it has seen (longer than
 * any name it looks for), only ever cuts at whitespace so a held-back word is
 * whole, and only matches a name once the character after it has arrived.
 * end() appends a space so a name at the very end of an answer still matches,
 * then removes it.
 *
 * DISGUISES. Before matching, text is NFKC-normalised (fullwidth letters,
 * the non-breaking hyphen and similar lookalikes fold to plain ones) and
 * invisible format characters (\p{Cf}: zero-width space, joiner, soft hyphen)
 * are removed. Between the two words any run of up to three spaces, dashes of
 * any kind, underscores, dots or middle dots counts, and a plural or
 * possessive is caught. The normalised text is what is sent.
 */

const WITHHELD = "(name withheld)"

const SEP = "[\\s\\p{Pd}_.\\u00B7]{0,3}"

const PATTERNS: RegExp[] = [
  new RegExp(`campaign${SEP}brain(?:s|'s|\u2019s)?(?:\\.[a-z]{2,6})?(?=[^\\p{L}\\p{N}])`, "giu"),
  new RegExp(`\\bnominate(?:${SEP}ai)?(?=[^\\p{L}\\p{N}])`, "giu"),
  // The platform's services are all named cb-something (cbkrnl, cbintel...).
  // English has almost no words that start "cb", so the whole prefix goes.
  /\bcb[a-z0-9]{2,12}(?=[^\p{L}\p{N}])/giu,
]

/** Fold lookalikes and drop invisible format characters. */
export function normalise(text: string): string {
  return text.normalize("NFKC").replace(/\p{Cf}/gu, "")
}

const HOLD = 40

export function redact(text: string): string {
  let out = normalise(text)
  for (const p of PATTERNS) out = out.replace(p, WITHHELD)
  return out
}

export class StreamRedactor {
  private buf = ""

  /** Add a delta; returns the text that is now safe to send (may be ""). */
  push(delta: string): string {
    this.buf = redact(this.buf + delta)
    const limit = this.buf.length - HOLD
    if (limit <= 0) return ""
    // Cut after the last whitespace at or before the limit, so the held tail
    // starts at the beginning of a word and \b means what it says.
    let cut = -1
    for (let i = limit; i >= 0; i--) {
      if (/\s/.test(this.buf[i])) {
        cut = i + 1
        break
      }
    }
    if (cut <= 0) return ""
    const ready = this.buf.slice(0, cut)
    this.buf = this.buf.slice(cut)
    return ready
  }

  /** Flush everything that is left. */
  end(): string {
    const out = redact(`${this.buf} `).slice(0, -1)
    this.buf = ""
    return out
  }
}
