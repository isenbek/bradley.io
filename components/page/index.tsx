/**
 * The page templates' parts (Brad, 2026-10-22: "reduce the page layout
 * variations to a handful of templates, all using the same styles in the same
 * spots"). Five templates are built from these, and nothing else:
 *
 *   Instrument   PageHead, an optional Section, one live component, an
 *                optional closing Section (how it works, fine print).
 *   Article      PageHead, then Section + one sibling block (Panel, ledger,
 *                Grid of rails, figure), repeated; one Actions row at the end.
 *   Project      Article with the interactive piece first.
 *   Report       Article whose blocks are Panels, each followed by Measured.
 *   Index        PageHead, an optional JumpNav, then Section + Grid, repeated.
 *
 * One-offs (accepted, owner's call 2026-10-22): the home page, /resume/print,
 * /about and /projects/turfy.
 *
 * The kit's rule holds throughout: prose sits in .prose, and every kit
 * component is a SIBLING of it, never a child. Section is the .prose; the
 * block after it is not inside it.
 *
 * Styles: app/kit.css, "TEMPLATES" (classes beta-t-*). A page that needs a
 * spacing or grid rule of its own should first ask whether one of these does
 * the job.
 */
import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"

export { BetaMeasured as Measured } from "@/app/_measured"

/** One step of the breadcrumb. The last one is the page itself and takes no href. */
export interface Crumb {
  label: string
  href?: string
}

/**
 * The top of every templated page: breadcrumb, title, and the lede as a
 * sibling after the head (the kit's .page-head holds only the crumb and h1).
 * `crumbs` lists the steps after "bradley.io"; the last is the current page.
 * `after` sits between the title and the lede, for the one page that needs a
 * line there (a tag row, an address); use it sparingly.
 */
export function PageHead({
  crumbs,
  title,
  lede,
  after,
}: {
  crumbs: Crumb[]
  title: ReactNode
  lede?: ReactNode
  after?: ReactNode
}) {
  return (
    <>
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {" / "}
              {c.href && i < crumbs.length - 1 ? (
                <Link href={c.href}>{c.label}</Link>
              ) : (
                <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1>{title}</h1>
      </div>
      {after}
      {lede ? <p className="lede">{lede}</p> : null}
    </>
  )
}

/**
 * A run of prose, optionally under a section heading. The h2 is the kit's
 * ruled section heading (.prose > h2). `id` goes on the heading so a JumpNav
 * or a link can land on it; `icon` sets a small icon before the heading (the
 * project write-ups carry one per section). Kit components go AFTER a
 * Section, not in it.
 */
export function Section({
  id,
  title,
  icon,
  className,
  children,
}: {
  id?: string
  title?: ReactNode
  icon?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={className ? `prose beta-sec ${className}` : "prose beta-sec"}>
      {title ? (
        <h2 id={id} className={icon ? "beta-t-icon" : undefined}>
          {icon}
          {icon ? <span>{title}</span> : title}
        </h2>
      ) : null}
      {children}
    </div>
  )
}

/**
 * The kit's panel: the machine talking. A bar with a name and a note, then
 * the face. `aside` is the note's place for an element that is its own mark
 * (a kind chip, a status), set as it is rather than wrapped in a span.
 */
export function Panel({
  name,
  note,
  aside,
  className,
  children,
}: {
  name: ReactNode
  note?: ReactNode
  aside?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className ? `panel ${className}` : "panel"}>
      <div className="panel-face">
        <div className="panel-bar">
          <b>{name}</b>
          {note ? <span>{note}</span> : null}
          {aside}
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * Cards in a grid that reflows to one column on a phone. `min` is the
 * narrowest a card may get before the grid drops a column (default 18rem);
 * it is clamped to the container, so a phone never scrolls sideways.
 * Replaces the per-page copies of the same auto-fit rule.
 */
export function Grid({
  min = "18rem",
  fill = false,
  className,
  as: Tag = "div",
  label,
  children,
}: {
  min?: string
  /** Keep empty tracks (auto-fill), so a short list does not stretch: a filtered card list. */
  fill?: boolean
  className?: string
  as?: "div" | "ul" | "section"
  label?: string
  children: ReactNode
}) {
  const cls = ["beta-t-grid", fill ? "beta-t-grid--fill" : "", className ?? ""].filter(Boolean).join(" ")
  return (
    <Tag
      className={cls}
      style={{ "--t-min": min } as CSSProperties}
      aria-label={label}
    >
      {children}
    </Tag>
  )
}

/**
 * Space between blocks, for a block that is not a Section and needs the
 * same gap above it that a Section gets. Replaces the per-page spacing
 * wrappers (beta-note-sec, beta-doc-sec, beta-bench-out and the rest).
 */
export function Block({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className ? `beta-t-block ${className}` : "beta-t-block"}>{children}</div>
}

/**
 * The closing row of buttons, once per page, with an optional line of fine
 * print beside them. Buttons are the kit's .btn.
 */
export function Actions({ note, children }: { note?: ReactNode; children: ReactNode }) {
  return (
    <p className="beta-t-actions">
      {children}
      {note ? <span className="quiet">{note}</span> : null}
    </p>
  )
}

/**
 * "On this page": the page's own sections as a row of tags, set above the
 * first one. A count, where given, rides inside its tag (/projects' groups).
 */
export function JumpNav({ items }: { items: { id: string; label: string; count?: number }[] }) {
  return (
    <nav className="beta-t-jump" aria-label="On this page">
      {items.map((it) => (
        <a className="tag" href={`#${it.id}`} key={it.id}>
          {it.label}
          {it.count !== undefined ? <b>{it.count}</b> : null}
        </a>
      ))}
    </nav>
  )
}

/**
 * Read more: the opening shows, the rest folds. The folded part is still in
 * the HTML (a <details>), so search, tinypeek and the site search read all of
 * it, and print opens it (app/kit.css). Put the opening in a Section before
 * it; inside, use Sections and kit blocks as anywhere else (prose stays in a
 * Section, panels beside it).
 */
export function ReadMore({
  label = "Read more",
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <details className="beta-t-more">
      <summary>{label}</summary>
      <div className="beta-t-more__body">{children}</div>
    </details>
  )
}

/**
 * A code block on the panel ground, with an optional caption. The kit's .code
 * styles a <pre> child; a bare <code> gets neither padding nor preserved
 * whitespace. A Section may hold one between its paragraphs.
 */
export function Code({ cap, children }: { cap?: string; children: string }) {
  return (
    <div className="code">
      {cap ? <div className="beta-code-cap">{cap}</div> : null}
      <pre>{children}</pre>
    </div>
  )
}
