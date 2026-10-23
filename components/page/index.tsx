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
 * or a link can land on it. Kit components go AFTER a Section, not in it.
 */
export function Section({
  id,
  title,
  className,
  children,
}: {
  id?: string
  title?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={className ? `prose beta-sec ${className}` : "prose beta-sec"}>
      {title ? <h2 id={id}>{title}</h2> : null}
      {children}
    </div>
  )
}

/** The kit's panel: the machine talking. A bar with a name and a note, then the face. */
export function Panel({
  name,
  note,
  className,
  children,
}: {
  name: ReactNode
  note?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className ? `panel ${className}` : "panel"}>
      <div className="panel-face">
        <div className="panel-bar">
          <b>{name}</b>
          {note ? <span>{note}</span> : null}
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
  className,
  as: Tag = "div",
  label,
  children,
}: {
  min?: string
  className?: string
  as?: "div" | "ul" | "section"
  label?: string
  children: ReactNode
}) {
  return (
    <Tag
      className={className ? `beta-t-grid ${className}` : "beta-t-grid"}
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

/** "On this page": links to the page's own sections, set above the first one. */
export function JumpNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav className="beta-t-jump" aria-label="On this page">
      <span className="crumb">On this page</span>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`}>{it.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Read more: the opening shows, the rest folds. The folded text is still in
 * the HTML (a <details>), so search, tinypeek and the site search read all of
 * it, and print opens it (app/kit.css). Put the first paragraph or two in a
 * Section before it, and the rest here.
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
      <div className="prose beta-sec">{children}</div>
    </details>
  )
}
