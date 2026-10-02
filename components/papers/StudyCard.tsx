import {
  DOMAIN_FALLBACK,
  cleanText,
  cleanTitle,
  domainLabel,
  hasResults,
  monthYear,
  splitAbstract,
  statusTag,
  type Figure,
  type Study,
} from "./study"

/** A PDF the page found in public/, with its size on disk. */
export interface PaperFile {
  src: string
  bytes: number
}

/** A note on the abstract (ABSTRACT_NOTES in study.ts), resolved by the page. */
export interface ResolvedNote {
  before: string
  after: string
  parentSlug: string
  parentTitle: string
}

/** "1.4 MB", "412 KB": a size a reader can weigh before a phone downloads it. */
function fileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Thousands-separated in a fixed locale, so server output never varies. */
const nf = (n: number): string => n.toLocaleString("en-US")

/** Said once, to a screen reader, on every link that leaves the tab. */
const NEW_TAB = " (opens in a new tab)"

/**
 * A figure narrower than this (width over height) is a stack of panels, not a
 * plot. Letterboxed whole into the landscape well it is a sliver, so the well
 * shows its top at full width instead and says that it has done so. One of the
 * 43 figures on 2026-10-02 (1080 by 2340).
 */
const TALL = 0.8

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const t = statusTag(status)
  return (
    <span className="tag beta-papers-status" data-state={t.kind}>
      {t.label}
    </span>
  )
}

/**
 * The figure in its fixed-ratio well, or the same well empty.
 *
 * The empty well says "No preview figure", not "no figure": all it means is
 * that the pipeline found no image in the workspace's www/ folder. The study
 * may still have figures in its paper or an interactive one at the lab.
 *
 * A tall figure (see TALL) shows its top, and says so in a line UNDER the
 * well. The first version laid that label over the image, where it covered
 * the plot's axis and its first points.
 */
function FigureWell({ figure, title }: { figure: Figure | null; title: string }) {
  if (!figure) {
    return (
      <div className="beta-papers-figbox">
        <div className="beta-papers-fig beta-papers-fig--none">
          <span>No preview figure</span>
        </div>
      </div>
    )
  }
  const tall =
    figure.width !== null && figure.height !== null && figure.width / figure.height < TALL
  return (
    <div className="beta-papers-figbox">
      <a
        className="beta-papers-fig"
        data-fit={tall ? "top" : undefined}
        href={figure.src}
        target="_blank"
        rel="noopener noreferrer"
        title="Open the figure at full size, in a new tab"
      >
        {/* Plain <img>: the @next/next eslint plugin is not configured in this
            repo, so a disable comment for no-img-element is itself an error.
            The well around it has a fixed ratio, so a lazy image arriving late
            moves nothing; width and height are the file's own, read from its
            header by the page. */}
        <img
          src={figure.src}
          alt={`Figure from "${title}"${tall ? ", top part" : ""}`}
          width={figure.width ?? undefined}
          height={figure.height ?? undefined}
          loading="lazy"
          decoding="async"
        />
        <span className="sr-only">{NEW_TAB}</span>
      </a>
      {tall && (
        <p className="beta-papers-fig__note">The top of a taller figure. It opens whole.</p>
      )}
    </div>
  )
}

/**
 * The results table of the one study that publishes one (resultsSummary).
 * Computed by a pipeline, so it is on panel, inside the card.
 *
 * A readout, not a bar chart. The first version drew the CVs as bars on one
 * linear scale: the three earthquake streams (1.17 to 1.32) came out as
 * slivers beside the geomagnetic ones (above 55), so the picture said
 * "earthquakes do not cluster" directly under a sentence saying every stream
 * does. The finding is a threshold, CV above 1, and a column of numbers with
 * that threshold stated in its head says it without a scale to misread.
 *
 * Two columns, because at 320px a readout holds a name and one number: the
 * event count and the verdict ride under the stream's name.
 */
function ResultsPanel({ r }: { r: NonNullable<Study["resultsSummary"]> }) {
  const shown = r.highlights.length
  const scope =
    shown < r.totalStreams ? `the first ${shown} of ${r.totalStreams} streams` : `all ${shown} streams`
  return (
    <div className="panel beta-papers-result">
      <div className="panel-face">
        <div className="panel-bar">
          <b>Key finding</b>
          <span>CV above 1</span>
        </div>
        <p className="beta-papers-result__line">
          {r.clustered} of {r.totalStreams} event streams bunch in time: the gaps between events
          vary more than random timing would give.
        </p>
        <table className="readout beta-papers-result__table">
          <caption className="beta-chart__cap">Time between events, {scope}</caption>
          <thead>
            <tr>
              <th scope="col">Event stream</th>
              <th scope="col" className="num">
                CV <span className="beta-papers-result__unit">(random = 1)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {r.highlights.map((h) => (
              <tr key={h.label}>
                <th scope="row">
                  {h.label}
                  <span className="beta-papers-result__sub">
                    {nf(h.events)} events, {h.verdict.toLowerCase()}
                  </span>
                </th>
                <td className="num">{h.cv.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="beta-chart__note">
          CV is the coefficient of variation of the time between events: its spread over its mean.
          Random timing gives 1; above 1, events come in bunches with long quiet gaps between.
        </p>
      </div>
    </div>
  )
}

/**
 * One study. Server-rendered, no state: the whole index is in the HTML and the
 * domain filter is CSS (see the block beta-papers-* in app/kit.css).
 *
 * `figure` and `paper` are passed in only after the page has checked that the
 * file is really in public/. The data file saying so is not enough: a card
 * with a broken image, or a button to a 404, is a claim that failed.
 *
 * A study with a published results table gets the wide card: the same parts,
 * laid across the whole row with the results beside them. It leads the grid,
 * so the one finding on the page is the first thing in it and no ordinary row
 * is stretched to the height of a card with a panel inside.
 */
export function StudyCard({
  study: s,
  figure,
  paper,
  note,
}: {
  study: Study
  figure: Figure | null
  paper: PaperFile | null
  note?: ResolvedNote | null
}) {
  const title = cleanTitle(s.title)
  const { lead, rest } = splitAbstract(s.description ?? "")
  const finding = s.findingsSummary ? cleanText(s.findingsSummary) : null
  const started = monthYear(s.createdAt)
  const workspace = `https://terrapulse.info/lab/${encodeURIComponent(s.slug)}`
  const feature = hasResults(s)

  const facts = [
    s.dataFileCount > 0 ? `${s.dataFileCount} data ${s.dataFileCount === 1 ? "file" : "files"}` : null,
    // hasViz: the workspace's www/ folder holds an .html figure. It lives at
    // the lab, not here, and the words say so.
    s.hasViz ? "interactive figure in the workspace" : null,
  ].filter(Boolean)

  const head = (
    <>
      <p className="beta-papers-meta">
        {/* The pipeline's fall-through domain says nothing about a study, so it
            is a filter chip and not a tag on the card. */}
        {s.category !== DOMAIN_FALLBACK && <span className="tag">{domainLabel(s.category)}</span>}
        <StatusBadge status={s.status} />
        {started && <span className="beta-papers-date">{started}</span>}
      </p>

      <h3>{title}</h3>

      {lead ? (
        <p className="beta-papers-abs">{lead}</p>
      ) : (
        <p className="beta-papers-abs quiet">No abstract in the index. See the workspace.</p>
      )}

      {rest.length > 0 && (
        <details className="beta-papers-more">
          <summary>Rest of the abstract</summary>
          {rest.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </details>
      )}

      {note && (
        <p className="beta-papers-absnote">
          {note.before} <a href={`#${note.parentSlug}`}>{note.parentTitle}</a>, {note.after}
        </p>
      )}

      {finding && (
        <div className="beta-papers-finding">
          <b>Finding</b>
          <p>{finding}</p>
        </div>
      )}
    </>
  )

  const links = (
    <div className="beta-papers-links">
      {facts.length > 0 && <span className="beta-papers-facts">{facts.join(", ")}</span>}
      {/* The same weight as the workspace link: a raised button here was the
          loudest object on the page and outweighed the finding beside it. */}
      {paper && (
        <a className="beta-papers-out" href={paper.src} target="_blank" rel="noopener noreferrer">
          Read the paper
          <span className="beta-papers-out__meta">PDF, {fileSize(paper.bytes)}</span>
          <span className="sr-only">{NEW_TAB}</span>
        </a>
      )}
      <a className="beta-papers-out" href={workspace} target="_blank" rel="noopener noreferrer">
        Workspace on terrapulse.info
        <span className="sr-only">{NEW_TAB}</span>
      </a>
    </div>
  )

  if (feature && s.resultsSummary) {
    return (
      <article
        className="rail beta-papers-card beta-papers-card--feature"
        id={s.slug}
        data-domain={s.category}
      >
        <div className="beta-papers-feature">
          <FigureWell figure={figure} title={title} />
          <div className="beta-papers-feature__head">{head}</div>
          <ResultsPanel r={s.resultsSummary} />
          {links}
        </div>
      </article>
    )
  }

  return (
    <article className="rail beta-papers-card" id={s.slug} data-domain={s.category}>
      <FigureWell figure={figure} title={title} />
      {head}
      {links}
    </article>
  )
}
