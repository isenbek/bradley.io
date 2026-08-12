import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  Cpu,
  FileText,
  Github,
  Hammer,
  Library,
  Radio,
  ScrollText,
  Layers,
  AlertTriangle,
} from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { DieStack } from "@/components/mos/DieStack"
import { DiePlates } from "@/components/mos/DiePlates"

/* ------------------------------------------------------------------ *
 * VITALS — the chip itself, in the numbers people actually quote.
 * ------------------------------------------------------------------ */
const VITALS: { k: string; v: string; sub: string }[] = [
  { k: "Debut", v: "Sept 1975", sub: "WESCON, Chuck Peddle's team at MOS Technology" },
  { k: "Price", v: "$25", sub: "against $179 for the 8080 and the 6800" },
  { k: "Transistors", v: "3,510", sub: "counted off the traced die, not the datasheet" },
  { k: "Package", v: "40-pin DIP", sub: "8-bit data, 16-bit address, 64 KB of space" },
  { k: "Clock", v: "1 MHz", sub: "2 MHz for the 6502A; two phases per cycle" },
  { k: "Instructions", v: "56", sub: "151 documented opcodes, 13 addressing modes" },
  { k: "Registers", v: "A · X · Y", sub: "plus S, PC and the P status byte" },
  { k: "Zero page", v: "256 bytes", sub: "reachable in one byte, so it acts like 256 registers" },
  { k: "Still shipping", v: "Today", sub: "as WDC's 65C02, 50 years on" },
]

/* The 56 official mnemonics — the entire documented instruction set. */
const MNEMONICS =
  "ADC AND ASL BCC BCS BEQ BIT BMI BNE BPL BRK BVC BVS CLC CLD CLI CLV CMP CPX CPY DEC DEX DEY EOR INC INX INY JMP JSR LDA LDX LDY LSR NOP ORA PHA PHP PLA PLP ROL ROR RTI RTS SBC SEC SED SEI STA STX STY TAX TAY TSX TXA TXS TYA".split(
    " "
  )

/* ------------------------------------------------------------------ *
 * MACHINES — where the part actually landed.
 * ------------------------------------------------------------------ */
const MACHINES: { year: string; name: string; part: string }[] = [
  { year: "1976", name: "MOS KIM-1", part: "6502" },
  { year: "1977", name: "Apple II · Commodore PET · Atari VCS", part: "6502 / 6507" },
  { year: "1979", name: "Atari 400 & 800", part: "6502" },
  { year: "1980", name: "Commodore VIC-20 · Acorn Atom", part: "6502" },
  { year: "1981", name: "BBC Micro", part: "6502A" },
  { year: "1982", name: "Commodore 64", part: "6510" },
  { year: "1983", name: "Nintendo Famicom / NES", part: "Ricoh 2A03" },
  { year: "1986", name: "Apple IIgs", part: "65C816" },
]

/* ------------------------------------------------------------------ *
 * THE ARCHIVE — everything worth keeping, grouped and link-checked.
 *
 * `status` is only set where a link needs a warning: it renders as an
 * amber chip so nobody has to discover the breakage themselves.
 * ------------------------------------------------------------------ */
type Res = { name: string; href: string; note: string; status?: string }
type Group = { id: string; icon: typeof Cpu; title: string; blurb: string; items: Res[] }

const GROUPS: Group[] = [
  {
    id: "source",
    icon: Layers,
    title: "The source material",
    blurb:
      "visual6502.org itself: the site, the simulators, the die shots, and the polygon data everything else is built on. It runs, but it has not been touched since 2012, and it is HTTP only.",
    items: [
      {
        name: "visual6502.org",
        href: "http://visual6502.org/",
        note: "The project home. Last content update: January 8, 2012.",
        status: "http only",
      },
      {
        name: "JSSim · the original simulator",
        href: "http://visual6502.org/JSSim/index.html",
        note: "The 2010 in-browser transistor-level 6502. Kiosk mode: play, step, reset.",
      },
      {
        name: "JSSim · advanced",
        href: "http://visual6502.org/JSSim/expert.html",
        note: "Node search, memory editing, logged traces, arbitrary programs. Where the real work happens.",
      },
      {
        name: "Visual 6800",
        href: "http://visual6502.org/JSSim/expert-6800.html",
        note: "The same treatment applied to Motorola's competitor.",
      },
      {
        name: "Visual ARM1",
        href: "http://visual6502.org/sim/varm/armgl.html",
        note: "The first ARM, simulated the same way. The 6502's most consequential descendant.",
      },
      {
        name: "visual6502 on GitHub",
        href: "https://github.com/trebonian/visual6502",
        note: "segdefs, transdefs, nodenames and chipsim: the geometry and the solver, MIT licensed.",
      },
      {
        name: "6502 die shots",
        href: "http://visual6502.org/images/6502/index.html",
        note: "The high-resolution photographs of the decapped die that the polygons were traced from.",
      },
      {
        name: "The visual6502 wiki",
        href: "http://visual6502.org/wiki/index.php?title=Main_Page",
        note: "The chip collection, the user guides, the working notes. The MediaWiki behind it now returns a 500.",
        status: "down · 500",
      },
      {
        name: "Wiki, via the Internet Archive",
        href: "https://web.archive.org/web/2021/http://visual6502.org/wiki/index.php?title=Chips_in_our_collection",
        note: "The chips-in-our-collection index as it stood before the wiki fell over.",
        status: "mirror",
      },
      {
        name: "visual6502 blog",
        href: "http://blog.visual6502.org/",
        note: "Decapping write-ups, new chips, and the reconstruction work as it happened.",
      },
      {
        name: "6502 in Action · SIGGRAPH 2010 slides",
        href: "http://visual6502.org/docs/6502_in_action_14_web.pdf",
        note: "The talk that introduced the project. Still the best short explanation of the method.",
        status: "pdf",
      },
      {
        name: "SIGGRAPH 2010 abstract",
        href: "http://visual6502.org/docs/6502_siggraph2010_abs.pdf",
        note: "Two pages on modelling a chip as polygons instead of behaviour.",
        status: "pdf",
      },
      {
        name: "FAQ",
        href: "http://visual6502.org/faq.html",
        note: "Why not just write an emulator, how long a chip takes to preserve, and what the tooling is.",
      },
      {
        name: "Downloads",
        href: "http://visual6502.org/downloads.html",
        note: "Netlists, polygon data and images, straight from the source.",
      },
      {
        name: "The original links page",
        href: "http://visual6502.org/links.html",
        note: "The team's own bibliography, circa 2011. Several entries have rotted; most have not.",
      },
    ],
  },
  {
    id: "rebuild",
    icon: Cpu,
    title: "This rebuild",
    blurb:
      "The same die data, re-rendered on the GPU and re-solved in a faster engine, verified node-for-node against the original.",
    items: [
      {
        name: "Visual 6502 · run it",
        href: "https://6502.tinymachines.ai/",
        note: "Pan, zoom, tap a wire to trace its connected group, and watch the registers fall out of the silicon.",
      },
      {
        name: "tinymachines/6502",
        href: "https://github.com/tinymachines/6502",
        note: "Source for the renderer, the solver, and the verification harness.",
      },
      {
        name: "perfect6502",
        href: "https://github.com/mist64/perfect6502",
        note: "Michael Steil's C port of the same netlist: the reference for how fast this simulation can go.",
      },
    ],
  },
  {
    id: "reference",
    icon: ScrollText,
    title: "Reference and primary documents",
    blurb: "What MOS actually shipped to engineers, plus the modern reference sites that superseded it.",
    items: [
      {
        name: "MCS6500 Family Hardware Manual (1976)",
        href: "http://archive.6502.org/books/mcs6500_family_hardware_manual.pdf",
        note: "The original manual: pinouts, timing diagrams, bus behaviour, interrupt sequences.",
        status: "pdf",
      },
      {
        name: "MCS6500 Family Programming Manual (1976)",
        href: "http://archive.6502.org/books/mcs6500_family_programming_manual.pdf",
        note: "MOS teaching you its own instruction set, addressing modes and idioms.",
        status: "pdf",
      },
      {
        name: "6502.org documents",
        href: "http://www.6502.org/documents/",
        note: "The deepest single archive of datasheets, app notes and errata for the whole family.",
      },
      {
        name: "6502 instruction set (mass:werk)",
        href: "https://www.masswerk.at/6502/6502_instruction_set.html",
        note: "The cleanest opcode reference on the web: per-instruction flags, cycles and modes.",
      },
      {
        name: "Obelisk 6502 reference",
        href: "http://www.6502.org/users/obelisk/",
        note: "Andrew Jacobs' tutorial-style architecture and instruction reference, rehoused at 6502.org.",
      },
      {
        name: "c64ref · 6502 tables",
        href: "https://www.pagetable.com/c64ref/6502/",
        note: "Side-by-side comparison of how a dozen sources document each opcode. Excellent for settling arguments.",
      },
      {
        name: "MOS 6502 on Wikipedia",
        href: "https://en.wikipedia.org/wiki/MOS_6502",
        note: "The history, the variants, the lawsuit, and the part where it never really died.",
      },
    ],
  },
  {
    id: "opcodes",
    icon: FileText,
    title: "The opcodes MOS never documented",
    blurb:
      "56 mnemonics were published. The decoder responds to plenty more, because it decodes rather than looks up, and demoscene coders have been mining the leftovers ever since.",
    items: [
      {
        name: "How MOS 6502 illegal opcodes really work",
        href: "https://www.pagetable.com/?p=39",
        note: "Michael Steil derives the undocumented instructions from the decode ROM instead of cataloguing them.",
      },
      {
        name: "Extended opcode matrix (oxyron)",
        href: "http://www.oxyron.de/html/opcodes02.html",
        note: "All 256 opcodes on one page, legal and otherwise, with cycles and flags.",
      },
      {
        name: "Opcode decoding logic",
        href: "http://www.llx.com/~nparker/a2/opcodes.html",
        note: "Neil Parker on the aaabbbcc bit pattern that makes the whole instruction set fall into place.",
      },
      {
        name: "NMOS 6510 Unintended Opcodes",
        href: "https://csdb.dk/release/?id=198357",
        note: "The definitive community document on the unstable ones, down to which are safe at which temperature.",
      },
    ],
  },
  {
    id: "build",
    icon: Hammer,
    title: "Learn it, write it, build one",
    blurb: "The 6502 is still the best first CPU, and it is still buyable new.",
    items: [
      {
        name: "Ben Eater's 6502 computer",
        href: "https://eater.net/6502",
        note: "Build a working 6502 machine on breadboards, one video at a time. The modern on-ramp.",
      },
      {
        name: "easy6502",
        href: "https://skilldrick.github.io/easy6502/",
        note: "Nick Morgan's tutorial with an assembler and simulator embedded right in the page.",
      },
      {
        name: "mass:werk disassembler",
        href: "https://www.masswerk.at/6502/disassembler.html",
        note: "Paste bytes, get source. Handles the undocumented opcodes too.",
      },
      {
        name: "6502.org tutorials",
        href: "http://www.6502.org/tutorials/",
        note: "Decimal mode, interrupts, multiplication, 16-bit arithmetic: the hard-won practical notes.",
      },
      {
        name: "forum.6502.org",
        href: "https://forum.6502.org/",
        note: "Still active, still answering questions, still the place homebrew designs get reviewed.",
      },
      {
        name: "Western Design Center",
        href: "https://www.westerndesigncenter.com/wdc/",
        note: "Bill Mensch, co-designer of the original, has been selling CMOS 6502s continuously since 1981.",
      },
    ],
  },
  {
    id: "family",
    icon: Radio,
    title: "The chips it shared a board with",
    blurb:
      "A 6502 on its own does nothing visible. The machines people remember are the 6502 plus one strange custom chip.",
    items: [
      {
        name: "NESdev · CPU",
        href: "https://www.nesdev.org/wiki/CPU",
        note: "The Ricoh 2A03: a 6502 with decimal mode fused off and a sound engine bolted on.",
      },
      {
        name: "C64-Wiki · 6510",
        href: "https://www.c64-wiki.com/wiki/6510",
        note: "The 6502 with an I/O port grafted into zero page, which is how the C64 banks its memory.",
      },
      {
        name: "Stella",
        href: "https://stella-emu.github.io/",
        note: "The Atari 2600 emulator. The 2600 had 128 bytes of RAM and no framebuffer: the CPU drew the picture.",
      },
      {
        name: "AtariAge",
        href: "https://www.atariage.com/",
        note: "TIA schematics, the STELLA programmer's guide, and thirty years of 2600 programming threads.",
      },
      {
        name: "Apple II FPGA",
        href: "http://www.cs.columbia.edu/~sedwards/apple2fpga/",
        note: "Stephen Edwards rebuilds an entire Apple II, 6502 included, in reconfigurable logic.",
      },
    ],
  },
  {
    id: "reading",
    icon: Library,
    title: "Worth reading properly",
    blurb: "Three pieces that explain why anyone bothers tracing polygons off a 50-year-old die.",
    items: [
      {
        name: "Simplicity Betrayed",
        href: "https://cacm.acm.org/magazines/2010/6/92483-simplicity-betrayed/fulltext",
        note: "George Phillips on why emulating a simple machine accurately is so much harder than it looks.",
      },
      {
        name: "The 6502 and the best layout guy in the world",
        href: "https://research.swtch.com/6502",
        note: "Russ Cox on hand-drawn layout, and how much of the 6502's elegance is physical rather than logical.",
      },
      {
        name: "Intel 4004 35th anniversary project",
        href: "http://www.4004.com/",
        note: "The reconstruction effort that visual6502 explicitly took its cue from, and diverged from.",
      },
    ],
  },
]

const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0)

export default function MosPage() {
  return (
    <div className="v3-longform v3-mos">
      {/* HERO ========================================================== */}
      <header className="v3-page-head" style={{ paddingBottom: 16 }}>
        <div className="v3-blob v3-blob--1" aria-hidden style={{ left: "-80px", top: "-40px", width: 360, height: 360 }} />
        <div className="v3-wrap">
          <Link href="/" className="v3-detail-back">
            <ArrowLeft size={14} strokeWidth={2.4} /> Home
          </Link>

          <V3Reveal eager>
            <span className="v3-pill v3-pill--blue" style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
              <Cpu size={14} strokeWidth={2.4} /> preservation · silicon archaeology
            </span>
          </V3Reveal>

          <V3Reveal eager>
            <h1>
              The 6502, <span className="v3-accent">switch by switch.</span>
            </h1>
          </V3Reveal>

          <V3Reveal eager>
            <p className="v3-page-head__lede">
              In 2009 a small team dissolved the package off a MOS 6502, photographed the die, and
              traced roughly 20,000 polygons by hand. That data is the reason you can watch a 1975
              processor run in a browser instead of reading about it. I have rebuilt the simulator
              on top of it, and gathered everything else worth keeping here, because the site it all
              came from has not been updated since 2012.
            </p>
          </V3Reveal>

          <V3Reveal delay={80}>
            <div className="v3-mos-cta">
              <a
                href="https://6502.tinymachines.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="v3-btn v3-btn--primary"
              >
                Run the chip →
              </a>
              <a href="#archive" className="v3-btn v3-btn--ghost">
                {TOTAL} resources, archived ↓
              </a>
            </div>
          </V3Reveal>
        </div>
      </header>

      {/* VITALS ======================================================== */}
      {/* THE DIE ======================================================= */}
      <section className="v3-section">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">01 / THE DIE</div>
              <h2>One chip was destroyed to make this.</h2>
              <p>
                Summer 2009: a MOS 6502 revision D had its package dissolved, its surface
                photographed under a Nikon Optiphot at 10× plus roughly 15× to the camera, and then
                its metal and polysilicon etched away so the substrate underneath could be shot and
                aligned to the first image. Around 200 frames per pass, stitched. Everything on this
                page descends from these two photographs.
              </p>
            </div>
          </V3Reveal>

          <V3Reveal delay={60}>
            <DiePlates />
          </V3Reveal>

          <V3Reveal delay={100}>
            <p className="v3-mos-note v3-mos-note--wide">
              The plates the team published are 4,677 × 5,097 pixels, and their originals are twice
              that again in each direction. Click either one to open it full screen and zoom in far
              enough to pick out individual transistors. Then step through what happens next: the
              same patch of die, photographed, stripped, traced, and finally turned into the
              polygons the simulation actually runs.
            </p>
          </V3Reveal>

          <V3Reveal delay={140}>
            <DieStack />
          </V3Reveal>

          <V3Reveal delay={160}>
            <p className="v3-mos-credit-line">
              Die images by the visual6502 team, Greg James et al.
              <a href="http://visual6502.org/images/6502/index.html" target="_blank" rel="noopener noreferrer">
                visual6502.org
              </a>
              · licensed <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 3.0</a>,
              re-encoded for the web and served from this host under the same terms.
            </p>
          </V3Reveal>
        </div>
      </section>

      <section className="v3-section v3-section--paper">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">02 / THE PART</div>
              <h2>3,510 transistors that moved the industry.</h2>
              <p>
                The 6502 was not the best processor of 1975. It was the one an engineer could
                afford out of pocket, and that turned out to matter more than everything else
                combined.
              </p>
            </div>
          </V3Reveal>

          <V3Reveal delay={60}>
            <div className="v3-mos-vitals">
              {VITALS.map((v) => (
                <div key={v.k} className="v3-mos-vital">
                  <span className="v3-mos-vital__k">{v.k}</span>
                  <span className="v3-mos-vital__v">{v.v}</span>
                  <span className="v3-mos-vital__sub">{v.sub}</span>
                </div>
              ))}
            </div>
          </V3Reveal>

          <V3Reveal delay={100}>
            <div className="v3-panel v3-mos-isa">
              <div className="v3-cardhead">
                <h3>The whole documented instruction set</h3>
                <span className="v3-cardhead__meta">56 mnemonics · 151 opcodes · 13 addressing modes</span>
              </div>
              <div className="v3-mos-mnems">
                {MNEMONICS.map((m) => (
                  <span key={m} className="v3-mos-mnem">
                    {m}
                  </span>
                ))}
              </div>
              <p className="v3-mos-note">
                An 8-bit opcode has room for 256. The decoder answers to most of the rest as well,
                because it decodes bit patterns rather than consulting a table, and the leftovers
                have been load-bearing in demoscene code for forty years.
              </p>
            </div>
          </V3Reveal>

          <V3Reveal delay={140}>
            <div className="v3-panel v3-mos-tl">
              <div className="v3-cardhead">
                <h3>Where it landed</h3>
                <span className="v3-cardhead__meta">the part, and the machines built around it</span>
              </div>
              <ol className="v3-mos-tl__list">
                {MACHINES.map((m) => (
                  <li key={m.year} className="v3-mos-tl__row">
                    <span className="v3-mos-tl__year">{m.year}</span>
                    <span className="v3-mos-tl__dot" aria-hidden />
                    <span className="v3-mos-tl__name">{m.name}</span>
                    <span className="v3-mos-tl__part">{m.part}</span>
                  </li>
                ))}
              </ol>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* THE REBUILD =================================================== */}
      <section className="v3-section">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">03 / THE REBUILD</div>
              <h2>A photograph of a chip, running.</h2>
              <p>
                Same polygons, new engine. The die geometry comes from the visual6502 trace
                untouched; what changed is how fast it can be solved and how it gets drawn.
              </p>
            </div>
          </V3Reveal>

          <div className="v3-mos-cards">
            <V3Reveal>
              <article className="v3-panel">
                <h3 className="v3-mos-card__t">The die is real</h3>
                <p className="v3-mos-card__b">
                  8,233 traced shapes across six mask layers, triangulated into 83,227 triangles.
                  Metal sits translucent over polysilicon over diffusion, in the same order it does
                  on silicon.
                </p>
              </article>
            </V3Reveal>
            <V3Reveal delay={70}>
              <article className="v3-panel">
                <h3 className="v3-mos-card__t">The glow is the simulation</h3>
                <p className="v3-mos-card__b">
                  A node lights when it is logically high. That is not an animation: it is 3,510
                  switches being solved to a fixed point twice per clock cycle, and then painted.
                </p>
              </article>
            </V3Reveal>
            <V3Reveal delay={140}>
              <article className="v3-panel">
                <h3 className="v3-mos-card__t">Wires are not fixed things</h3>
                <p className="v3-mos-card__b">
                  Tap a trace and it highlights what it is connected to at that instant. The
                  connected group changes as transistors open and close, which is the entire point.
                </p>
              </article>
            </V3Reveal>
          </div>

          <V3Reveal delay={80}>
            <div className="v3-panel v3-mos-verify">
              <div className="v3-cardhead">
                <h3>Two oracles, because one proves nothing</h3>
                <span className="v3-cardhead__meta">verification</span>
              </div>
              <div className="v3-mos-verify__grid">
                <div>
                  <h4>Against the original</h4>
                  <p>
                    A headless harness runs the original visual6502 JavaScript and dumps the level
                    of all 1,725 nodes at every half-cycle. This engine matches bit for bit. Matching
                    registers would only show agreement about the 6502; matching every node shows
                    agreement about the silicon.
                  </p>
                </div>
                <div>
                  <h4>Against the datasheet</h4>
                  <p>
                    Documented cycle counts including page-crossing and branch penalties, the
                    read-modify-write double write, JSR and RTS stack layout, ADC and SBC flags,
                    decimal mode. A shared misreading of the die data would pass the first test and
                    fail this one.
                  </p>
                </div>
                <div>
                  <h4>Fast enough to feel</h4>
                  <p>
                    About 28,500 half-cycles per second natively, roughly 94 times the original
                    JavaScript, and the renderer redraws in six draw calls regardless of zoom,
                    because the layout never changes.
                  </p>
                </div>
                <div>
                  <h4>Try this</h4>
                  <p>
                    Run ADC and step one half-cycle at a time. It reaches the next opcode fetch with
                    A still holding the old value: the result is sitting in the ALU hold register and
                    transfers a cycle later. An emulator that commits at instruction boundaries
                    cannot show you that, because it is not true of the silicon.
                  </p>
                </div>
              </div>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* WHY ARCHIVE =================================================== */}
      <section className="v3-section v3-section--paper">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">04 / WHY BOTHER</div>
              <h2>The archive is one hosting bill from gone.</h2>
              <p>
                visual6502.org still serves every byte it ever did. It is also visibly unattended,
                and the work it holds cannot be redone casually: six weeks of one person&apos;s spare
                time went into the 6502 alone, and the physical chip was destroyed to get it.
              </p>
            </div>
          </V3Reveal>

          <V3Reveal delay={60}>
            <div className="v3-mos-decay">
              <div className="v3-mos-decay__row">
                <AlertTriangle size={16} strokeWidth={2.3} />
                <span className="v3-mos-decay__what">HTTPS certificate expired</span>
                <span className="v3-mos-decay__when">July 3, 2022</span>
                <span className="v3-mos-decay__note">
                  The site is reachable over plain HTTP only. Browsers increasingly disagree.
                </span>
              </div>
              <div className="v3-mos-decay__row">
                <AlertTriangle size={16} strokeWidth={2.3} />
                <span className="v3-mos-decay__what">The wiki returns HTTP 500</span>
                <span className="v3-mos-decay__when">checked Aug 2026</span>
                <span className="v3-mos-decay__note">
                  The chip collection index and user guides are readable only via the Internet Archive.
                </span>
              </div>
              <div className="v3-mos-decay__row">
                <AlertTriangle size={16} strokeWidth={2.3} />
                <span className="v3-mos-decay__what">Last content update</span>
                <span className="v3-mos-decay__when">January 8, 2012</span>
                <span className="v3-mos-decay__note">
                  Fourteen years of stillness, AdSense tags and all.
                </span>
              </div>
            </div>
          </V3Reveal>

          <V3Reveal delay={100}>
            <p className="v3-mos-note v3-mos-note--wide">
              None of that is a complaint. The team gave the work away under terms that let anyone
              carry it forward, which is exactly what this page and the rebuilt simulator are: a
              second copy, on hardware I control, with the links checked.
            </p>
          </V3Reveal>
        </div>
      </section>

      {/* THE ARCHIVE =================================================== */}
      <section className="v3-section" id="archive">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">05 / THE ARCHIVE</div>
              <h2>Everything 6502, in one place.</h2>
              <p>
                {TOTAL} resources across seven groups, every link fetched and checked. Anything
                broken or degraded is labelled rather than quietly left to fail.
              </p>
            </div>
          </V3Reveal>

          {GROUPS.map((g, gi) => {
            const Icon = g.icon
            return (
              <V3Reveal key={g.id} delay={gi * 40}>
                <section className="v3-mos-group">
                  <div className="v3-mos-group__head">
                    <span className="v3-mos-group__ico">
                      <Icon size={18} strokeWidth={2.2} />
                    </span>
                    <div>
                      <h3>{g.title}</h3>
                      <p>{g.blurb}</p>
                    </div>
                    <span className="v3-mos-group__n">{g.items.length}</span>
                  </div>

                  <ul className="v3-mos-list">
                    {g.items.map((it) => (
                      <li key={it.href}>
                        <a
                          href={it.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="v3-mos-res"
                        >
                          <span className="v3-mos-res__body">
                            <span className="v3-mos-res__name">
                              {it.name}
                              {it.status ? (
                                <span className="v3-mos-res__status">{it.status}</span>
                              ) : null}
                            </span>
                            <span className="v3-mos-res__note">{it.note}</span>
                            <span className="v3-mos-res__url">{it.href.replace(/^https?:\/\//, "")}</span>
                          </span>
                          <ArrowUpRight className="v3-mos-res__arrow" size={17} strokeWidth={2.3} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              </V3Reveal>
            )
          })}
        </div>
      </section>

      {/* CREDIT ======================================================== */}
      <section className="v3-section v3-section--paper">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-panel v3-mos-credit">
              <div className="v3-sec-head__num" style={{ marginBottom: 10 }}>
                06 / CREDIT
              </div>
              <h2 className="v3-mos-credit__h">Someone had to trace every polygon.</h2>
              <p>
                This exists because the visual6502 team decapped a 6502, photographed the die,
                traced it by hand, and gave it away: Greg James, Brian Silverman, Barry Silverman,
                Ed Spittles, Segher Boessenkool, Achim Breidenbach, and everyone else who
                contributed.
              </p>
              <p>
                Code is MIT. The die geometry is CC BY-NC-SA 3.0, attributed to Greg James and
                www.visual6502.org, and those terms carry to this deployment and to anything you
                take from it.
              </p>
              <div className="v3-mos-cta" style={{ marginTop: 22 }}>
                <a
                  href="https://6502.tinymachines.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v3-btn v3-btn--primary"
                >
                  Run the chip →
                </a>
                <a
                  href="https://github.com/tinymachines/6502"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v3-btn v3-btn--ghost"
                >
                  <Github size={14} strokeWidth={2.3} style={{ marginRight: 7 }} />
                  Source
                </a>
                <a
                  href="http://visual6502.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v3-btn v3-btn--ghost"
                >
                  visual6502.org
                </a>
              </div>
            </div>
          </V3Reveal>
        </div>
      </section>
    </div>
  )
}
