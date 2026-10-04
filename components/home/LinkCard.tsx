import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"
import { externalRel } from "@/lib/external-rel"

/**
 * LinkCard: a whole card that is one link, with the kit's detent press.
 *
 *   <LinkCard href="/meatball" title="Meatball" go="/meatball" tags={["Whisper"]}>
 *     One line about it.
 *   </LinkCard>
 *
 * PROPS
 *   href      a path on this site ("/meatball") or a full URL. A full URL opens
 *             in a new tab with lib/external-rel.ts's rel (no referrer, except
 *             into the family, where doors are counted), as every external
 *             link in the shell does, and takes the up-right arrow.
 *   title     the card's h3.
 *   children  the body: one or two sentences.
 *   tags      short static labels under the body (kit .tag, not .chip: a chip
 *             is a toggle and these do nothing).
 *   go        where it goes, printed at the foot in mono: a host or a path.
 *
 * The look is two classes, .rail (the kit's card) and .beta-linkcard (the
 * press; app/kit.css, in the home block, written to be shared). A page that
 * needs a different inside can wear the two classes on its own <a> and skip
 * this component.
 *
 * A server component. No state: the press is CSS.
 */
export function LinkCard({
  href,
  title,
  children,
  tags,
  go,
}: {
  href: string
  title: string
  children: ReactNode
  tags?: readonly string[]
  go: string
}) {
  const external = /^https?:\/\//.test(href)
  const inside = (
    <>
      <h3>{title}</h3>
      <p>{children}</p>
      {tags?.length ? (
        <span className="beta-linkcard__tags">
          {tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </span>
      ) : null}
      <span className="beta-linkcard__go">
        {go}
        {external ? (
          <ArrowUpRight size={14} strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
        )}
      </span>
    </>
  )

  return external ? (
    <a className="rail beta-linkcard" href={href} target="_blank" rel={externalRel(href)}>
      {inside}
    </a>
  ) : (
    <Link className="rail beta-linkcard" href={href}>
      {inside}
    </Link>
  )
}
