/**
 * /about, as data. Everything a person wrote for that page lives here, with
 * the source of each piece beside it, so a later edit cannot quietly retype a
 * claim.
 *
 * TWO KINDS OF TEXT, AND WHICH IS WHICH
 *
 *   The operator's own words. LEDE, PHILOSOPHY and five of the six
 *   CAREER_LINES are the original site's About page (git show
 *   63d43d0:app/about/page.tsx), which he wrote. They are reused verbatim
 *   with the mechanical changes noted beside each: the dashes became commas
 *   and colons (the site's punctuation rule), and "I recently scored" lost
 *   its "recently", because the paragraph has been on the site since at least
 *   February 2026 and the word had stopped being true.
 *
 *   New text. STILL_TRUE, NOW and the notes on the cards were written on
 *   2026-10-02 from things that can be checked on this site or this machine.
 *   Each carries its evidence in a comment. Do not add a sentence here that
 *   has none.
 *
 * The career's names, titles and years are NOT here: they are lib/resume.ts,
 * the one source for every role.
 */

/**
 * The page head. TITLE is his name, as /resume prints it, so the page opens on
 * the person it is about. LEDE is 63d43d0:app/about/page.tsx's header
 * paragraph, whole and in order, the way that page opened under its own
 * heading. The one dash in it became ", where".
 *
 * "15+ years" is his wording and still his wording: lib/resume.ts SUMMARY says
 * "more than fifteen years designing secure, large-scale data systems". It
 * counts the big-data work, not the career, which starts in 1997; the aside
 * prints that as "First role", with the company, so the two do not read as one
 * number disagreeing with itself.
 */
export const TITLE = "Bradley S. Isenbek"
export const LEDE =
  "I'm your typical non-typical developer. While I've spent 15+ years architecting production systems that process billions of data points, what really drives me is the work I do in my garage lab, where I turn constraints into innovation and curiosity into working systems."

/** 63d43d0:app/about/page.tsx, the Philosophy section, in order. */
export const PHILOSOPHY: string[] = [
  "Case in point: I scored 60 Raspberry Pis from a failed business. Most people would resell them. I built a distributed investigation tool with 40 Pi4 workers running a VPN cluster with Tor DNS lookup and headless browser automation. It's messy, it's scrappy, and it works.",
  "I'm an integrator at heart. I dumpster dive for gear because working within constraints forces creative solutions. I run my own DNS server on a Frankenstein Linux box I built from salvaged parts. I host everything locally because I want to understand how it all fits together.",
  "I bring this same mindset to production work: find elegant solutions, question assumptions, build tools that last. Whether it's processing 4.9 billion data points, architecting high-availability messaging platforms, or leading classified government projects, I approach every problem as an opportunity to build something that actually works.",
]

/**
 * The present-day paragraph, as sentence parts so the page can link the nouns.
 * It opens by naming what it continues (the second Philosophy paragraph's "I
 * host everything locally"), because it follows the third, which is about
 * production work. Evidence for each:
 *   served from home    app/meatball/page.tsx ("a caseless home server"),
 *                       app/eyes/layout.tsx ("the camera on the bradley.io
 *                       box"), CLAUDE.md ("Anti-Cloud. Host Local"): systemd
 *                       and nginx on this machine, no cloud host.
 *   the Geiger counter  app/trng/page.tsx ("A CAJOE Geiger counter, a
 *                       Raspberry Pi").
 *   Meatball            app/meatball/page.tsx (lede and bill of materials).
 *   the 6502            app/6502/page.tsx; the survey confirms the simulator
 *                       is built from the visual6502 die photographs.
 */
export const STILL_TRUE: { text: string; href?: string }[] = [
  { text: "I still host locally: this site is served from a box at home, not from a cloud. " },
  { text: "A Geiger counter and a Raspberry Pi", href: "/trng" },
  { text: " turn radioactive decay into random numbers. " },
  { text: "Meatball", href: "/meatball" },
  {
    text: " is a home server built from other people's cast-offs that can see, hear and talk back. And there is ",
  },
  { text: "a MOS 6502", href: "/6502" },
  { text: " simulated transistor by transistor from photographs of its die." },
]

/**
 * Skills, hand-grouped the way the original page grouped them.
 *
 * Every item is in one of two lists the operator wrote: the original About
 * page's skills (63d43d0, marked o) or lib/resume.ts EXPERTISE (marked r).
 * ESP32 is the one item from elsewhere in the resume (PROJECTS, "ESP32 AI
 * Edge"). Not the pipeline-derived list in site-data.json: that one counts
 * words in session logs and leads with "Go, Git, JSON".
 */
export const SKILLS: { group: string; items: string[] }[] = [
  {
    group: "Languages",
    // o: Python, TypeScript, C/C++, Bash, Go, Rust. r: SQL, C# and .NET, Java.
    items: ["Python", "TypeScript", "Rust", "C and C++", "Go", "Bash", "SQL", "C# and .NET", "Java"],
  },
  {
    group: "Data",
    // o: Snowflake, PostgreSQL, DynamoDB, Redis, SQLite, Elasticsearch.
    // r: Apache Solr, ETL pipelines.
    items: [
      "PostgreSQL",
      "Snowflake",
      "DynamoDB",
      "Redis",
      "SQLite",
      "Elasticsearch",
      "Apache Solr",
      "ETL pipelines",
    ],
  },
  {
    group: "AI and ML",
    // o: Ollama, Claude, PyTorch, Hugging Face, LangChain, Vector DBs.
    // r: Claude and the Anthropic API, Agentic frameworks, RAG pipelines,
    //    Vector databases, Entity resolution.
    items: [
      "Claude and the Anthropic API",
      "Ollama",
      "Agentic frameworks",
      "RAG pipelines",
      "Vector databases",
      "Hugging Face",
      "PyTorch",
      "LangChain",
      "Entity resolution",
    ],
  },
  {
    group: "Infrastructure",
    // o: AWS, Docker, Kubernetes, FastAPI, Nginx, Linux.
    // r: Linux administration, High-availability design.
    items: ["Linux", "Nginx", "Docker", "AWS", "Kubernetes", "FastAPI", "High-availability design"],
  },
  {
    group: "Hardware",
    // o: Raspberry Pi, Arduino, LoRa, Edge TPU, Custom Protocols. r: ESP32.
    items: ["Raspberry Pi", "ESP32", "Arduino", "LoRa", "Edge TPU", "Custom protocols"],
  },
  {
    group: "Tools",
    // o: Git, Vim, Playwright, Jupyter, Prometheus, Grafana. r: CI/CD.
    items: ["Git", "Vim", "Playwright", "Jupyter", "Prometheus", "Grafana", "CI/CD"],
  },
]

export interface NowLink {
  href: string
  label: string
  /** True for another site: opens in a new tab with rel=noopener. */
  external?: boolean
}

export interface NowCard {
  id: "chips" | "terrapulse" | "site" | "trades"
  title: string
  body: string
  /** A credit or a caveat that has to travel with the card. */
  note?: string
  /** A short list of links with a phrase each, set like the status rows. */
  rows?: { href: string; name: string; line: string }[]
  links: NowLink[]
}

/**
 * What is being built in 2026. Four cards, present tense.
 *
 *   chips       tinymachines.ai. Fact-checked survey (sites.json,
 *               tinymachines-site and tinymachines-engines): a transistor-level
 *               MOS 6502 simulated from die photographs, and switch-level
 *               simulations of the console's two chips. The console that plays
 *               in the browser does NOT run those switch-level chips: the
 *               survey's check corrected that claim to "fast chip models
 *               derived from, and checked against, switch-level simulations
 *               of its two chips", and the card says it that way. Keep it.
 *               The 6502 die data is visual6502.org's, CC BY-NC-SA; the two
 *               console chips are Quietust's Visual 2A03 and Visual 2C02. No
 *               die image is shown on /about, but the credit travels with the
 *               card anyway.
 *   terrapulse  Survey (sites.json, terrapulse): measured data only, no models
 *               or forecasts; a public read-only MCP server; its own team page
 *               lists him as Architect. tinychase reads the same data lake and
 *               runs small models in the visitor's browser. Repos are private:
 *               the live sites are linked, nothing else.
 *   site        CLAUDE.md, Project Overview: the instruments read a Geiger
 *               counter, an ADS-B receiver, GPS, the robot's cameras and the
 *               router's drop logs. The ADS-B and GPS producers share one
 *               bus (components/dragonfli/worldevent/decoders: adsb.uat,
 *               gps.position);
 *               /visitors fuses the router's drops with the web server's
 *               logs (app/_nav.ts: "who has been trying the doors"). The
 *               card's status rows are SITE_ROWS below, read live.
 *   trades      app/housecalls/tools/page.tsx: the four tools and the line
 *               "They work for the person holding the phone and report to no
 *               one", which is reused. Each row's phrase is cut from that
 *               page's own line for the tool (its TOOLS list), not rewritten.
 */
export const NOW: NowCard[] = [
  {
    id: "chips",
    title: "Chips, from their photographs",
    body: "A MOS 6502 simulated at the transistor level from photographs of its die, then the two chips of an NES done the same way, and a console that plays in the browser on fast models derived from those simulations and checked against them.",
    note: "The die photographs and netlists are other people's work: visual6502.org (CC BY-NC-SA) and Quietust's Visual 2A03 and Visual 2C02.",
    links: [
      { href: "https://tinymachines.ai", label: "tinymachines.ai", external: true },
      { href: "/6502", label: "The 6502 here" },
    ],
  },
  {
    id: "terrapulse",
    title: "TerraPulse",
    body: "A platform for measured climate and geophysical data: readings from public instruments, no models and no forecasts, with a public read-only MCP server so an AI agent can ask it questions. I am its architect. I also engineered tinychase, which runs small models on that measured data in the visitor's own browser.",
    links: [
      { href: "https://terrapulse.info", label: "terrapulse.info", external: true },
      { href: "https://tinychase.com", label: "tinychase.com", external: true },
    ],
  },
  {
    id: "site",
    title: "This site and its instruments",
    body: "The pages here read real hardware on my network: a Geiger counter, an ADS-B receiver and a GPS on one bus, Meatball's camera, and the logs of who tried the doors at the router and the web server. When a box is switched off, its page says so, and so does this card.",
    links: [{ href: "/bench", label: "The bench: every live page" }],
  },
  {
    id: "trades",
    title: "Free tools for the trades",
    body: "Four field tools for trade workers. No account, no subscription, nothing uploads. They work for the person holding the phone and report to no one.",
    rows: [
      { href: "/housecalls/tools/quote", name: "Quote pad", line: "line items in, a professional quote out" },
      { href: "/housecalls/tools/change-order", name: "Change-order pad", line: "photo, price, and a signature before the work" },
      { href: "/housecalls/tools/photos", name: "Job photo stamper", line: "job, time, and location burned into every photo" },
      { href: "/housecalls/tools/materials", name: "Voice material pad", line: "say the list in the truck" },
    ],
    links: [{ href: "/housecalls/tools", label: "The tools" }],
  },
]

/**
 * The four instruments the "This site" card reports, in the order its copy
 * names them. `id` is the row of /api/now that is read; `name` is what the
 * card calls it, which matches the card's own sentence and not the shared
 * panel's label ("Perception bus", "Meatball eye"); `href` is its page.
 *
 *   geiger    the Geiger box behind /trng
 *   bus       the collector both the ADS-B and the GPS producers broadcast to
 *   cameras   the frame store Meatball's camera writes once a minute
 *   firewall  the visitors snapshot: the router's drops and the web server's
 *             scanner trap, fused by the collector behind /visitors
 */
export const SITE_ROWS: { id: "geiger" | "bus" | "cameras" | "firewall"; name: string; href: string }[] = [
  { id: "geiger", name: "Geiger counter", href: "/trng" },
  { id: "bus", name: "ADS-B and GPS bus", href: "/dragonfli" },
  { id: "cameras", name: "Meatball's camera", href: "/meatball" },
  { id: "firewall", name: "Door logs", href: "/visitors" },
]

/**
 * The three field notes. Titles and blurbs are app/meatball/page.tsx's own
 * (ENTRIES), so the two pages describe the same notes in the same words.
 */
export const WRITING: { href: string; kicker: string; title: string; blurb: string }[] = [
  {
    href: "/meatball/notes/senses",
    kicker: "Field note 01",
    title: "I gave a junk-pile eyes, ears, and a voice",
    blurb:
      "The whole saga: the salvaged bill of materials, the debugging traps that cost an hour each, the calibration insight, and finally talking to the WOPR out loud.",
  },
  {
    href: "/meatball/notes/listening",
    kicker: "Field note 02",
    title: "The math of listening",
    blurb:
      "Low-level DSP from raw samples to a working voice gate: the real FFT, windowing (200x less leakage), spectral-subtraction denoise and its U-curve. Every number from a live run.",
  },
  {
    href: "/meatball/notes/motion",
    kicker: "Field note 03",
    title: "Teaching the eyes to ignore a box fan",
    blurb:
      "One cheap fan fooled both senses. Locking the camera's auto-exposure, then an adaptive per-cell gate that self-mutes the fan, the monitors and lighting blips, so it only fires on what should not move.",
  },
]

/**
 * The six roles the page tells, each in one line. The bars above them show
 * all fourteen; /resume tells every one in full, in the resume's sentences,
 * and this list is deliberately not that again.
 *
 * Keyed by the company name in lib/resume.ts, which supplies the name, the
 * title and the years. The line is the original About page's own description
 * of that role (63d43d0:app/about/page.tsx, `timeline`), which he wrote:
 *
 *   VictoryText           verbatim.
 *   ConservativeConnector verbatim.
 *   TransUnion            the original read "Search infrastructure for
 *                         [a named client], classified government projects, ML
 *                         modeling." The client is not named in lib/resume.ts
 *                         or anywhere on the live site, so it is not named
 *                         here; "more than 10,000 data sources" and the
 *                         singular "a classified project with the United
 *                         States Government" are the resume's wording.
 *   nextSource            verbatim.
 *   PipeLive              verbatim, with the resume's "PC Magazine's".
 *   SysForge.ai           not in the original (it is newer). The resume's
 *                         context line and its second and third bullets,
 *                         shortened.
 */
export const CAREER_LINES: Record<string, string> = {
  "SysForge.ai":
    "My own firm: AI consulting and development, agentic pipelines and AI-augmented toolchains for enterprise clients.",
  "VictoryText, LLC":
    "High-volume messaging platform with FastAPI, DynamoDB, and multi-carrier integration.",
  "ConservativeConnector, LLC":
    "Data systems processing 100M+ contacts and 4.9B data points with Snowflake.",
  "TransUnion, TruLookup Division":
    "Search infrastructure over more than 10,000 data sources, a classified project with the United States Government, ML modeling.",
  "nextSource / PeopleTicker":
    "Global real-time labor-rate calculator with Java, Weka, and Apache Solr.",
  "PipeLive, LLC":
    "Real-time collaboration software. 12 industry awards including PC Magazine's Winner's Circle.",
}

/**
 * The signature on "How this site is built".
 *
 * NULL UNTIL HE HAS READ IT. The block makes statements in two names, and a
 * signature printed over text its signer has not read is the one thing on
 * this page that must not ship on anyone else's say-so. While this is null the
 * block renders without a "Signed" row: the two rails still say who does
 * what, and nothing claims his endorsement. When he has read the block and
 * agrees, set the date he did (ISO, "YYYY-MM-DD") and the row appears, signed
 * by both.
 */
export const SIGNED_ON: string | null = null
