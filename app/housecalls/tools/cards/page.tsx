"use client"

import Link from "next/link"
import { QR_TOOLS_SVG } from "@/components/housecalls/card-qr"
import { Actions, PageHead, Section } from "@/components/page"

/**
 * The counter cards, printable (docs/housecalls/counter-cards.md is the
 * plan). Screen shows the instructions; print renders a letter sheet of
 * eight business cards with cut lines. Black on white on purpose: these
 * ride home printers and copy shops, and toner is money.
 *
 * Client component only because the print button is; the card itself is
 * static markup around a build-time QR.
 */

function Card() {
  return (
    <div className="beta-cc-card">
      <div className="beta-cc-card__head">FREE TOOLS FOR THE TRADES</div>
      <div className="beta-cc-card__body">
        <div className="beta-cc-card__list">
          Quote pad
          <br />
          Change orders, signed
          <br />
          Job photo stamper
          <br />
          Voice material lists
        </div>
        <div className="beta-cc-card__qr" dangerouslySetInnerHTML={{ __html: QR_TOOLS_SVG }} />
      </div>
      <div className="beta-cc-card__promise">
        No app store. No account. No catch.
        <br />
        Works for you. Reports to no one.
      </div>
      <div className="beta-cc-card__url">housecalls.bradley.io/tools</div>
    </div>
  )
}

export default function CounterCardsPage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "House Calls", href: "/housecalls" }, { label: "Free Tools", href: "/housecalls/tools" }, { label: "Counter Cards" }]}
        title="The counter cards."
        lede={
          <>
            The paper form of the giveaway: a letter sheet of eight cards for supply-house counters,
            black on white because toner is money. Print on cardstock, cut on the lines, ask the
            counter manager with the three sentences below.
          </>
        }
      />

      <Section title="The ask, verbatim">
        <p>
          &quot;I am a local engineer giving away free phone tools for the trades: quotes, change
          orders, job photos. No app, no account, nothing to sell your customers. Mind if I leave
          a few cards by the register?&quot;
        </p>
        <p>
          The rules ride along. Cards go only where the counter says yes. Never at a shop we are
          pitching, until they know us. No tracking codes on the cards, so the only measure is
          whether people show up, which the{" "}
          <Link href="/housecalls">open ledger</Link> reports honestly. The full plan is in{" "}
          <Link href="/housecalls/docs/counter-cards">the paperwork</Link>.
        </p>
      </Section>

      <Actions>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print the sheet (8 cards)
        </button>
      </Actions>

      <div className="beta-cc-preview">
        <Card />
      </div>

      {/* print-only: the 8-up sheet */}
      <div className="beta-cc-sheet" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i} />
        ))}
      </div>
    </div>
  )
}
