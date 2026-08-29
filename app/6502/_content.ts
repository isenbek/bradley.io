/**
 * The 6502 page's content, lifted out of the page at the style-kit port.
 *
 * These arrays ARE the page: the vitals, the mnemonic set, where the part
 * landed, and the link-checked archive. They moved here so app/6502/page.tsx
 * could be rewritten on kit primitives without any of the content being
 * retyped, which is how a link or a transistor count quietly changes.
 *
 * The lucide `icon` field went with the port. The kit does not use icons, and
 * a field nothing reads is a field that goes stale.
 */
/* ------------------------------------------------------------------ *
 * VITALS — the chip itself, in the numbers people actually quote.
 * ------------------------------------------------------------------ */
export const VITALS: { k: string; v: string; sub: string }[] = [
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
export const MNEMONICS =
  "ADC AND ASL BCC BCS BEQ BIT BMI BNE BPL BRK BVC BVS CLC CLD CLI CLV CMP CPX CPY DEC DEX DEY EOR INC INX INY JMP JSR LDA LDX LDY LSR NOP ORA PHA PHP PLA PLP ROL ROR RTI RTS SBC SEC SED SEI STA STX STY TAX TAY TSX TXA TXS TYA".split(
    " "
  )

/* ------------------------------------------------------------------ *
 * MACHINES — where the part actually landed.
 * ------------------------------------------------------------------ */
export const MACHINES: { year: string; name: string; part: string }[] = [
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
export type Res = { name: string; href: string; note: string; status?: string }
export type Group = { id: string; title: string; blurb: string; items: Res[] }

export const GROUPS: Group[] = [
  {
    id: "source",
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
