import { TerminalSquare } from "lucide-react"
import { V3Reveal } from "../_components/V3Reveal"
import { V3Terminal } from "./V3Terminal"

export default function V3TerminalPage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 24 }}>
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "160px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span
                className="v3-pill v3-pill--blue"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <TerminalSquare size={14} strokeWidth={2.25} />
                Terminal · interactive CLI
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Poke around the <span className="v3-accent">old-fashioned way.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                Same portfolio, command line. Type <code style={cliCode}>help</code> to start, or
                tap any of the suggestion chips. Arrow keys recall history, Tab completes, Ctrl+L
                clears.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* TERMINAL ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 0 }}>
        <div className="v3-wrap" style={{ maxWidth: 980 }}>
          <V3Reveal>
            <V3Terminal />
          </V3Reveal>
        </div>
      </section>
    </>
  )
}

const cliCode: React.CSSProperties = {
  fontFamily: "var(--font-v3-mono), monospace",
  fontSize: "0.9em",
  background: "var(--v3-paper)",
  padding: "2px 8px",
  borderRadius: 6,
  border: "1px solid var(--v3-line)",
  color: "var(--v3-blue-700)",
}
