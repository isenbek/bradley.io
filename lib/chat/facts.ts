/**
 * The chat's curated facts about the site and the work: what the resume does
 * not carry, each with the page that shows it.
 *
 * Every line traces to a source, named beside it. Two kinds:
 *
 *   SITE   a page on bradley.io already says it; the line is that page's own
 *          wording, shortened. app/projects/page.tsx and
 *          components/about/content.ts are the two main sources.
 *   OWNER  the owner's written answers of 2026-10-02 (the phase 2 brief).
 *          These decide what is said about current work, the job search,
 *          location and salary, and they override anything older.
 *
 * Rules this file keeps, from the same answers: the private platform built on
 * the SysForge fabric is described, never named, and no service of it is
 * named; no client, user, customer or revenue claim; MyFinalWishes is named
 * but not linked; nothing about salary except that it is private; no private
 * individual is named; no internal hostname, address, port or security
 * detail.
 */

export interface Fact {
  topic: string
  text: string
  /** Pages or sites that show it. Only these URLs may be given as evidence. */
  links?: string[]
}

export const FACTS: Fact[] = [
  // OWNER, answer 4 (job search) and 6 (location).
  {
    topic: "Looking for work",
    text: "Bradley is open to full-time roles in AI systems and data architecture. He works remotely, or on site in the Grand Rapids, Michigan area. The way in is the resume, the PDF, or an email.",
    links: ["/resume", "/resume.pdf", "/contact", "mailto:brad@bradley.io"],
  },
  // OWNER, answer 7.
  {
    topic: "Salary and compensation",
    text: "Private. Not published anywhere, and not something this chat discusses. It is a conversation to have with Bradley directly, by email.",
    links: ["mailto:brad@bradley.io"],
  },
  // OWNER, answers 1 and 2; SysForge.ai's dates are lib/resume.ts.
  {
    topic: "SysForge.ai, current work (2024 to present)",
    text: "SysForge.ai is Bradley's own firm. On it he has built a production-ready prototype platform on the SysForge fabric. Its core elements: a journaled state kernel, a forge planner, a service mesh, core business services, and an intelligence crawler, a backend cluster in his garage that harvests terabytes of data. Applications and their data sit on top of the SysForge fabric. It is a prototype, not a client engagement, and these core ideas are where his attention is going next. The platform's own name is not public. (This is everything published about it; there is no more detail to give.)",
    links: ["/resume"],
  },
  // OWNER, answer 5; description from docs/autoresume/professional-experience.md
  // (features only: its stack line there is the earlier prototype, so the stack
  // is left to lib/resume.ts, which has the current one).
  {
    topic: "MyFinalWishes",
    text: "A product shipped through SysForge: a digital estate-planning platform for organizing documents, tracking assets, designating beneficiaries and recording final messages, with encrypted document storage and trusted-contact notifications. Bradley is its only engineer; the resume gives the stack and the build. (No link is given for it here.)",
    links: ["/resume"],
  },
  // OWNER, answer 2; lib/resume.ts.
  {
    topic: "VictoryText (2022 to present)",
    text: "Current. Architect and developer of a high-volume messaging platform; details are on the resume.",
    links: ["/resume"],
  },
  // OWNER, answer 3; SITE: app/projects/page.tsx, components/about/content.ts NOW.
  {
    topic: "TerraPulse",
    text: "Bradley is the architect and builder of TerraPulse, a platform for measured climate and geophysical data: readings from public instruments, with no models, forecasts or reanalysis. It serves the same records to AI agents through a public, read-only MCP server. Python, FastAPI, PostgreSQL with PostGIS, Parquet.",
    links: ["https://terrapulse.info", "https://terrapulse.info/mcp"],
  },
  {
    topic: "tinychase",
    text: "Bradley engineered tinychase: small models on measured public data, run entirely in the visitor's browser. DuckDB-WASM reads Parquet over ranged requests, and an experimental cyclone model runs on the visitor's GPU through WebGPU.",
    links: ["https://tinychase.com"],
  },
  // SITE: app/projects/page.tsx (CHIPS), components/about/content.ts NOW "chips"; OWNER answer 8.
  {
    topic: "The 6502 and the NES (tinymachines.ai)",
    text: "A transistor-level simulation of the MOS 6502, built from photographs of its die: 3,510 transistors solved to a fixed point twice per clock cycle, in Rust and WebAssembly. Then the NES's two chips done the same way, and a console that plays in the browser on fast models derived from those simulations and checked against them. The die photographs and netlists are other people's work: visual6502.org (CC BY-NC-SA) and Quietust's Visual 2A03 and Visual 2C02. The simulation engine is extracted as an MIT library, halfphi.",
    links: ["/6502", "https://tinymachines.ai/6502", "https://tinymachines.ai/nes", "https://github.com/tinymachines/halfphi"],
  },
  // SITE: app/projects/page.tsx INSTRUMENTS; CLAUDE.md project overview.
  {
    topic: "This site and its live instruments",
    text: "bradley.io is served from a box at Bradley's home, not from a cloud. Its instrument pages read real hardware: a Geiger counter turning radioactive decay into random numbers (/trng), an ADS-B receiver and GPS on one bus (/dragonfli), Meatball, a home server built from cast-off parts that can see, hear and talk with every model running locally (/meatball), software-defined radios (/sdr), and logs of who tried the doors (/visitors). /bench lists every live page and whether it is up.",
    links: ["/bench", "/trng", "/dragonfli", "/meatball", "/sdr", "/visitors"],
  },
  // SITE: app/_nav.ts blurbs. /work, /ai-pilot and /cost-analysis are left out
  // on purpose: as of 2026-10-02 they print the private platform's name (owner
  // answer 1), so the chat must not send anyone there. Add them back here once
  // those pages are scrubbed; prompt.ts also refuses them as evidence.
  {
    topic: "Evidence of how he works",
    text: "/the-shift is what changed when the tooling changed; /papers holds research notes.",
    links: ["/the-shift", "/papers"],
  },
  // SITE: app/projects/page.tsx MATH.
  {
    topic: "Math instruments",
    text: "Single-file interactive pieces on prime numbers and the Riemann zeta function (Primality Atlas, Zeta Forge, Prime Orchestra, Primality Zoo, Storm Plates), and Critical Collapse, which integrates Einstein's equations live in the browser to measure the critical-collapse exponent.",
    links: ["/projects", "/projects/prime-atlas", "/projects/critical-collapse"],
  },
  // SITE: app/projects/page.tsx (PLATFORMS, trades tools), components/about/content.ts NOW "trades".
  {
    topic: "Free tools for the trades",
    text: "A quote pad, a change-order pad with signature, a job photo stamper and a voice material list, in the browser. No account, no subscription, and nothing uploads.",
    links: ["/housecalls/tools"],
  },
  // SITE: app/projects/page.tsx (style kit, SKETCHES).
  {
    topic: "Other open work",
    text: "The tinymachines style kit, the design system this site wears. Sovereign, an assembly-like agentic programming language with opcodes that ask a local model to write and rewrite code.",
    links: ["https://tinymachines.ai/style", "https://github.com/tinymachines/sovereign"],
  },
  // SITE: app/services, app/contact (nav blurbs).
  {
    topic: "Contact and services",
    text: "Email brad@bradley.io. /contact says what helps a first email; /services lists the consulting practices and ways to engage.",
    links: ["/contact", "/services", "mailto:brad@bradley.io"],
  },
]
