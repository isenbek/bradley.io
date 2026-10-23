import { LinkCard } from "./LinkCard"

/**
 * Selected work: six cards, curated by hand.
 *
 * Curated in code on purpose. The generated project list (site-data.json) has
 * 84 entries, model-written taglines and an isFeatured flag nobody tends, and
 * it was weak when the previous home page trusted it. These six are the ones
 * worth a stranger's click, and each line was checked against its source on
 * the date below.
 *
 * WHERE EVERY NUMBER COMES FROM (checked 2026-10-02):
 *   6502       tinymachines/6502 CLAUDE.md status table: the micro engine runs
 *              39.0 M half-cycles a second and replays all 289 recorded pin
 *              traces. "Held at the pins" is the precise claim: only the first
 *              rung is compared node for node.
 *   NES        tinymachines/2a03 and 2c02 READMEs (10,946 and 16,758
 *              transistors); tinymachines/nes README (19 of 20 dumped
 *              cartridges draw their picture). The console runs the FAST
 *              engines derived from the switch-level chips, not the
 *              switch-level chips themselves, and the card says so. The die
 *              traces are Quietust's, credited by name.
 *   TerraPulse terrapulse.info/api/v1/dex/kinds (80 published kinds) and a
 *              tools/list call to mcp.terrapulse.info (11 tools, read-only).
 *              "Architect" is the title its own team page gives.
 *   tinychase  tinychase/public/models/tf2 (555 KB: 485 KB of weights plus 23
 *              WGSL kernels). Model output there is an experiment, not data,
 *              and the card keeps that word.
 *   Meatball   app/meatball/page.tsx: the bill of materials has ten rows.
 *   House Calls  app/housecalls/tools/page.tsx: four tools, and its own
 *              sentence about what never uploads (typed, signed, photographed:
 *              it does not say "spoken", and neither does the card, because
 *              the voice pad uses the browser's speech recognition).
 *
 * These are facts about other repositories typed into this file. They do not
 * update themselves: when one changes, change it here and move the date in
 * WORK_CHECKED.
 */

/** The day every line below was last checked against its source. */
export const WORK_CHECKED = "2026-10-02"

interface Work {
  title: string
  href: string
  go: string
  line: string
  tags: readonly string[]
}

const WORK: Work[] = [
  {
    title: "The 6502, at the transistor level",
    href: "https://tinymachines.ai/6502",
    go: "tinymachines.ai/6502",
    line:
      "Not a program that imitates the chip: its real wires and switches, traced from the silicon. Faster engines are built from it and checked against it pin by pin. The quickest runs 39.0 million half-cycles a second and matches all 289 recorded test traces exactly.",
    tags: ["Rust", "WebAssembly", "WebGL2"],
  },
  {
    title: "The NES, from its two chips up",
    href: "https://tinymachines.ai/nes",
    go: "tinymachines.ai/nes",
    line:
      "Both chips in the console, 10,946 and 16,758 transistors, modelled switch by switch from Quietust's traces of the silicon, with fast engines built from them. On those, 19 of the 20 cartridges copied from my own collection draw their picture.",
    tags: ["Rust", "WebAssembly", "NTSC signal model"],
  },
  {
    title: "TerraPulse and its MCP server",
    href: "https://terrapulse.info",
    go: "terrapulse.info",
    line:
      "A platform for measured climate and earth-science records, never models or forecasts. 80 published indexes, and a public, read-only connection with 11 tools that AI assistants use to query them. I am its architect.",
    tags: ["PostgreSQL + PostGIS", "FastAPI", "MCP"],
  },
  {
    title: "tinychase",
    href: "https://tinychase.com",
    go: "tinychase.com",
    line:
      "Small AI models on measured public data, running in your own browser. An experimental hurricane-forecast model, just 555 KB, runs on your own graphics card. The data is read straight from files, with no database server in between. I engineered it.",
    tags: ["WebGPU", "DuckDB-WASM", "tinygrad"],
  },
  {
    title: "Meatball, the sensory robot",
    href: "/meatball",
    go: "/meatball",
    line:
      "A home server with no case, built from other people's cast-offs and taught to see, hear, think and speak. Ten salvaged parts, every AI model running on the machine itself, and nothing touches the cloud.",
    tags: ["local LLM", "Whisper", "neural voice"],
  },
  {
    title: "House Calls: tools for the trades",
    href: "/housecalls/tools",
    go: "/housecalls/tools",
    line:
      "Four free field tools: a quote pad, a change-order pad with a signature, a job photo stamper and a voice material list. No account, no subscription, and nothing you type, sign or photograph uploads anywhere.",
    tags: ["installable PWA", "IndexedDB", "Web Speech"],
  },
]

export function SelectedWork() {
  return (
    <div className="beta-home-work">
      {WORK.map((w) => (
        <LinkCard key={w.href} href={w.href} title={w.title} go={w.go} tags={w.tags}>
          {w.line}
        </LinkCard>
      ))}
    </div>
  )
}
