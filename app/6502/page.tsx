import Link from "next/link"
import { DiePlates } from "@/components/mos/DiePlates"
import { DieStack } from "@/components/mos/DieStack"
import { VITALS, MNEMONICS, MACHINES, GROUPS } from "./_content"

const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0)

/**
 * The 6502, on the style kit.
 *
 * Content lives in ./_content.ts so the port could not quietly retype a link or
 * a transistor count. The die visualisations stay as a v3 island: they are
 * canvas, and the kit has no opinion about a die plate.
 */
export default function Page() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">6502</span>
          </span>
        </nav>
        <h1>A photograph of a chip, running</h1>
      </div>

      <p className="lede">
        The 6502 was not the best processor of 1975. It was the one an engineer could afford out of
        pocket, and that turned out to matter more than everything else combined.
      </p>

      <div className="prose beta-sec">
        <h2>One chip was destroyed to make this</h2>
        <p>
          The visual6502 team decapped a 6502, photographed the die, traced every polygon by hand,
          and gave the result away. Everything below stands on that.
        </p>
      </div>

      {/* Canvas die plates. See .kit-island in app/kit.css. */}
      <div className="v3 kit-island">
        <DiePlates />
        <DieStack />
      </div>

      <div className="prose beta-sec">
        <h2>3,510 transistors that moved the industry</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>The part</b>
            <span>MOS Technology, 1975</span>
          </div>
          <table className="readout">
            <tbody>
              {VITALS.map((v) => (
                <tr key={v.k}>
                  <td>
                    {v.k}
                    <br />
                    <span style={{ color: "var(--color-glass-muted)", fontSize: "var(--text-fine)" }}>
                      {v.sub}
                    </span>
                  </td>
                  <td className="num">{v.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>The instruction set</h2>
        <p>
          56 mnemonics, 151 documented opcodes, 13 addressing modes. An 8-bit opcode has room for
          256, and the decoder answers to most of the rest as well, because it decodes bit patterns
          rather than consulting a table. The leftovers have been load-bearing in demoscene code
          for forty years.
        </p>
      </div>

      <p className="chips">
        {MNEMONICS.map((m) => (
          <span className="tag" key={m}>
            {m}
          </span>
        ))}
      </p>

      <div className="prose beta-sec">
        <h2>Where the part landed</h2>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Machines built on the 6502">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Machine</th>
                <th>Part</th>
              </tr>
            </thead>
            <tbody>
              {MACHINES.map((m) => (
                <tr key={`${m.year}-${m.name}`}>
                  <td className="name">{m.year}</td>
                  <td>{m.name}</td>
                  <td>{m.part}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Same polygons, new engine</h2>
        <p>
          The die geometry comes from the visual6502 trace untouched. What changed is how fast it
          can be solved and how it gets drawn.
        </p>
      </div>

      <div className="piece-grid">
        <div className="rail">
          <h3>It lights up</h3>
          <p>
            A node lights when it is logically high. That is not an animation: it is 3,510 switches
            being solved to a fixed point twice per clock cycle, and then painted.
          </p>
        </div>
        <div className="rail">
          <h3>It is connected</h3>
          <p>
            Tap a trace and it highlights what it is connected to at that instant. The connected
            group changes as transistors open and close, which is the entire point.
          </p>
        </div>
        <div className="rail">
          <h3>It is fast</h3>
          <p>
            About 28,500 half-cycles per second natively, roughly 94 times the original JavaScript,
            and the renderer redraws in six draw calls regardless of zoom, because the layout never
            changes.
          </p>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>How it is checked</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Verification</b>
            <span>against the original</span>
          </div>
          <p className="beta-org__what">
            A headless harness runs the original visual6502 JavaScript and dumps the level of all
            1,725 nodes at every half-cycle. This engine matches bit for bit. Matching registers
            would only show agreement about the 6502; matching every node shows agreement about the
            silicon.
          </p>
          <p className="beta-chart__note">
            Then the datasheet oracle: documented cycle counts including page-crossing and branch
            penalties, the read-modify-write double write, JSR and RTS stack layout, ADC and SBC
            flags, decimal mode. A shared misreading of the die data would pass the first test and
            fail this one.
          </p>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>The archive is one hosting bill from gone</h2>
        <p>
          visual6502.org runs, but it has not been touched since January 2012, it is reachable over
          plain HTTP only, and browsers increasingly disagree with that. The chip collection index
          and the user guides are readable only through the Internet Archive.
        </p>
        <p>
          None of that is a complaint. The team gave the work away under terms that let anyone
          carry it forward, which is exactly what this page is: a second copy, on hardware I
          control, with the links checked.
        </p>

        <h2>Everything 6502, in one place</h2>
        <p>
          {TOTAL} resources in {GROUPS.length} groups. Anything with a warning chip has a problem
          you would otherwise have to discover yourself.
        </p>
      </div>

      {GROUPS.map((g) => (
        <section key={g.id}>
          <div className="prose beta-sec">
            <h3>{g.title}</h3>
            <p>{g.blurb}</p>
          </div>
          <div className="ledger">
            <div className="scroller" tabIndex={0} role="region" aria-label={g.title}>
              <table>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>What it is</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((it) => (
                    <tr key={it.href}>
                      <td className="name">
                        <a href={it.href} target="_blank" rel="noopener noreferrer">
                          {it.name}
                        </a>
                      </td>
                      <td>{it.note}</td>
                      <td>
                        {it.status ? (
                          <span className="tag warn">{it.status}</span>
                        ) : (
                          <span className="tag live">ok</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="tbl-foot">
                <span>{g.items.length} resources</span>
              </div>
            </div>
          </div>
        </section>
      ))}

      <div className="prose beta-sec">
        <h2>Credit</h2>
        <p>
          This exists because the visual6502 team decapped a 6502, photographed the die, traced it
          by hand, and gave it away: Greg James, Brian Silverman, Barry Silverman, Ed Spittles,
          Segher Boessenkool, Achim Breidenbach, and everyone else who contributed.
        </p>
        <p>
          Code is MIT. The die geometry is CC BY-NC-SA 3.0, attributed to Greg James and
          www.visual6502.org, and those terms carry to this deployment and to anything you take
          from it.
        </p>
      </div>
    </div>
  )
}
