import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import type { NowId, NowSnapshot } from "@/components/live/types"
import { BenchDot } from "./BenchDot"
import { externalRel } from "@/lib/external-rel"

/**
 * BenchCard: one thing on the bench, as a card that is a link.
 *
 *   <BenchCard item={{ href: "/trng", title: "Hotbits", kind: "instrument",
 *                      line: "...", tech: ["Geiger counter"], dot: "geiger" }} />
 *
 * FIELDS (BenchItem)
 *   href    where the card goes. A path on this site, or a full URL for a
 *           page that lives elsewhere. Every card goes somewhere real: a thing
 *           with no page to open does not get a card.
 *   title   the thing's name.
 *   kind    one or two words above the title: what sort of thing it is.
 *   state   optional tag beside the kind, for a thing that is not finished
 *           ("in progress", "early"). A plain tag, never the orange one:
 *           unfinished is not ATTENTION.
 *   line    what it is, specifically. One or two sentences.
 *   tech    what it is made of. Kit .tag, not .chip: a chip is a toggle and
 *           these do nothing.
 *   dot     for an instrument on this server: which row of /api/now says
 *           whether it is answering. Prints BenchDot (components/live LiveDot
 *           with its words, complete in the server's HTML), so the card says
 *           "The Geiger counter is offline" when it is, and changes by itself
 *           when the box comes back. Pass the page's peekNow() snapshot as
 *           `initial` to BenchCard or BenchGrid.
 *   pic     optional picture of the thing itself, at the top of the card: a
 *           static import ({ src, width, height }) or the same shape by hand,
 *           and its alt text. A picture of the instrument, never decoration.
 *   more    other doors into the same thing (its page on another site, its
 *           map, its MCP server). Small links above the foot.
 *
 * THE SAME CARD AS THE HOME PAGE'S, with two more parts. It wears the kit's
 * .rail and the site's shared .beta-linkcard (app/kit.css, home block), so the
 * press, the shadow and the foot are the ones components/home/LinkCard has,
 * and the anatomy is in the same order: title, line, tags, where it goes.
 * What this adds is the kind line on top and the `more` links.
 *
 * WHY IT IS NOT ONE <a>. LinkCard is a single anchor, which cannot hold the
 * `more` links: an anchor inside an anchor is not valid. So here the card is
 * an <article>, the heading holds the one anchor, and that anchor's ::after is
 * stretched over the card (.beta-bench-card__link). A pointer can land
 * anywhere, a screen reader hears "The 6502, link" once, and the `more` links
 * sit above the stretched layer and are pressed for themselves.
 *
 * External links open in a new tab with lib/external-rel.ts's rel ("noopener
 * noreferrer", but only "noopener" into the family, so doors can be counted), as every
 * external link in the shell does, and take the up-right arrow.
 *
 * Put it in a .beta-bench-grid (BenchGrid below), as a sibling of .prose.
 */

export interface BenchItem {
  href: string
  title: string
  kind: string
  state?: string
  line: string
  tech: string[]
  dot?: NowId
  more?: { href: string; label: string }[]
  pic?: { src: string; width: number; height: number; alt: string }
}

const isExternal = (href: string) => /^https?:\/\//.test(href)

/** "tinymachines.ai/nes" for a URL, the path itself for a page on this site. */
function whereOf(href: string): string {
  if (!isExternal(href)) return href
  try {
    const u = new URL(href)
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "")
  } catch {
    return href
  }
}

function Door({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  if (isExternal(href)) {
    return (
      <a href={href} className={className} target="_blank" rel={externalRel(href)}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export function BenchCard({
  item,
  initial,
  feature = false,
}: {
  item: BenchItem
  initial?: NowSnapshot | null
  /** One of the two or three things a page opens on: a larger title and line. */
  feature?: boolean
}) {
  const external = isExternal(item.href)
  return (
    <article
      className={
        feature
          ? "rail beta-linkcard beta-bench-card beta-bench-card--feature"
          : "rail beta-linkcard beta-bench-card"
      }
    >
      {item.pic ? (
        <span className="beta-bench-card__pic">
          <img
            src={item.pic.src}
            width={item.pic.width}
            height={item.pic.height}
            alt={item.pic.alt}
            loading="lazy"
            decoding="async"
          />
        </span>
      ) : null}

      <p className="beta-bench-card__kind">
        <span>{item.kind}</span>
        {item.state ? <span className="tag">{item.state}</span> : null}
      </p>

      <h3>
        <Door href={item.href} className="beta-bench-card__link">
          {item.title}
        </Door>
      </h3>

      <p>{item.line}</p>

      {item.dot ? (
        <p className="beta-bench-card__dot">
          <BenchDot of={item.dot} initial={initial} />
        </p>
      ) : null}

      <span className="beta-linkcard__tags">
        {item.tech.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </span>

      {item.more?.length ? (
        <p className="beta-bench-card__more">
          <span>Also</span>
          {item.more.map((m) => (
            <Door key={m.href} href={m.href}>
              {m.label}
            </Door>
          ))}
        </p>
      ) : null}

      <span className="beta-linkcard__go">
        {whereOf(item.href)}
        {external ? (
          <>
            <span className="sr-only"> (another site, opens in a new tab)</span>
            <ArrowUpRight size={14} strokeWidth={2.2} aria-hidden="true" />
          </>
        ) : (
          <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
        )}
      </span>
    </article>
  )
}

/**
 * The grid the cards sit in. One column on a phone, three on a wide screen.
 * `pairs` holds a group of two or four in twos, so a short group fills its
 * rows instead of leaving one card alone on the last; `feature` prints the
 * cards larger (pair it with `pairs`).
 */
export function BenchGrid({
  items,
  initial,
  pairs = false,
  feature = false,
}: {
  items: BenchItem[]
  initial?: NowSnapshot | null
  pairs?: boolean
  feature?: boolean
}) {
  return (
    <div className={pairs ? "beta-bench-grid beta-bench-grid--pairs" : "beta-bench-grid"}>
      {items.map((item) => (
        <BenchCard key={item.href} item={item} initial={initial} feature={feature} />
      ))}
    </div>
  )
}
