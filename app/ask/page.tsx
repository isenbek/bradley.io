import Link from "next/link"
import { ChatPanel } from "@/components/chat/ChatPanel"

/**
 * /ask: questions about Bradley, answered by Claude from his resume.
 *
 * Paper for what a person wrote (the head, the note on how it works); the
 * conversation itself is machine output and sits on a panel inside
 * ChatPanel. Static: everything live happens in the client component against
 * /api/chat.
 */

export default function AskPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Ask</span>
          </span>
        </nav>
        <h1>Ask about Bradley</h1>
      </div>

      <p className="lede">
        Questions about my work and experience, answered by Claude from my resume and this site. Each
        answer links the evidence. For anything it cannot answer, email me.
      </p>

      <ChatPanel />

      <div className="prose beta-sec beta-chat-about">
        <h2>How this works</h2>
        <p>
          Every question goes to Claude, an AI model made by Anthropic, together with my{" "}
          <Link href="/resume">resume</Link> and a short set of facts about the projects on this site. It
          is told to answer only from that material, to say when it does not know, and to point to the
          page that shows each claim. It does not discuss salary or anything personal; those are
          conversations to have with me directly.
        </p>
        <p>
          It is capped: a few questions an hour for each visitor, a short question, and a small daily
          budget for the whole site. When the cap is reached it says so. Questions are sent to the API
          to be answered; this site keeps a count, not the conversation.
        </p>
        <p>
          It can be wrong. The resume is the record, and the{" "}
          <a href="/resume.pdf">PDF</a> is the version to forward. I am open to full-time roles in AI
          systems and data architecture, remote or on site in the Grand Rapids area:{" "}
          <a href="mailto:brad@bradley.io">brad@bradley.io</a>.
        </p>
      </div>
    </div>
  )
}
