/**
 * The resume, as data.
 *
 * Restored 2026-10-02. The site had a /resume page until the February 2026
 * rewrite removed it (commit ea75ab9); the data lived in lib/resume-data.json
 * and is recoverable from git history at 65eedb5.
 *
 * Two sources, and which one wins:
 *
 *   1. docs/bsi-resume-20260223.pdf: the operator's own most recent resume.
 *      It is the authority for the headline, the summary, the expertise
 *      lists, and the four roles from 2014 onward.
 *   2. lib/resume-data.json at 65eedb5: the only source for the nine roles
 *      before 2014, which the PDF leaves out for length.
 *
 * Where they disagree the PDF wins, being newer and signed off by the person
 * it describes. One such case: ConservativeConnector starts in 2018 here (the
 * PDF) and not 2020 (the old data file).
 *
 * A third source, added 2026-10-02 for the work since February 2026: the
 * owner's written answers of 2026-10-02 plus three read-only research passes
 * over the repositories on this machine (the platform core, disaster
 * recovery, MyFinalWishes), whose public-safe bullets were fact-checked. The
 * SysForge.ai role and the 2026 research role are built from those, and only
 * from those. The owner's rules for them, binding on every consumer:
 *
 *   - The prototype platform is described under SysForge.ai by what it does.
 *     Its own names, and the names of the services in it, never appear.
 *   - No salary, rate or range, anywhere. AVAILABILITY carries none on
 *     purpose; a consumer asked about pay declines and points to a
 *     conversation.
 *   - MyFinalWishes is named and never linked.
 *   - No users, customers or revenue for anything unless a source proves it.
 *   - No hostnames, addresses, ports or security details.
 *
 * Nothing on this page is generated or inferred. Every line traces to one of
 * those documents, edited only for voice (third person, no "I") and for the
 * site's punctuation rules. Do not add a claim here that is not in a
 * document the operator wrote or approved.
 *
 * EXPORTS (other code reads these: /resume, /resume/print and the PDF, the
 * resume MCP server, the /ask chat, /about, /services, /contact, /terminal):
 *
 *   RESUME_UPDATED, RESUME_PDF, HEADLINE, SUMMARY   strings
 *   ROLES, EARLIER_ROLES                            ResumeRole[]
 *   GOVERNMENT                                      string[]
 *   EXPERTISE, EDUCATION, PROJECTS                  as typed below
 *   AVAILABILITY  (2026-10-02)  what he is open to and where; no pay, ever
 *   STRENGTHS     (2026-10-02)  the three core strengths of the original site
 *   AWARDS        (2026-10-02)  the PipeLive awards, as structured rows
 *
 * ResumeRole gained two optional fields on 2026-10-02. `groups` splits a long
 * role into labelled runs of bullets; when present, `bullets` is still the
 * full flat list (the groups concatenated, in order), so a consumer that
 * ignores `groups` loses nothing. `links` are public pages for the role.
 */

export interface ResumeRole {
  years: string
  title: string
  company: string
  location?: string
  /** One line on what the company or product was. */
  context?: string
  /** Every bullet, flat. Always complete, even when `groups` is set. */
  bullets: string[]
  /** Optional: the same bullets under short labels, in the same order. */
  groups?: { label: string; bullets: string[] }[]
  /** Optional: public pages for the role. Absolute URLs or site paths. */
  links?: { label: string; href: string }[]
  tech?: string[]
}

export const RESUME_UPDATED = "2026-10-02"

export const RESUME_PDF = "/resume.pdf"

export const HEADLINE =
  "AI systems architect and machine learning engineer: agent platforms, data architecture, and the hardware they run on."

export const SUMMARY: string[] = [
  "AI systems architect and machine learning engineer with more than fifteen years designing secure, large-scale data systems for government and enterprise clients, including a classified project for the United States Government and infrastructure processing billions of records. Expert in AI and ML pipelines, distributed systems, and secure data management.",
  "Since February 2026: a production-ready prototype platform of 84 self-hosted services on the SysForge fabric, with a journaled state kernel for agents, a declarative execution engine and planner, a service mesh, and an intelligence crawler; MyFinalWishes, a digital estate-planning product shipped through SysForge; a transistor-level 6502 and a switch-level NES at tinymachines.ai; and TerraPulse, an open climate and geophysical data platform. Daily co-development with Claude and other frontier models, with every working session and its cost on the public record.",
]

/**
 * What he is open to, in the owner's words of 2026-10-02. There is no pay
 * field and there never will be: salary is private. A consumer asked about
 * pay says so and points to `contact`.
 */
export const AVAILABILITY = {
  open: true,
  statement: "Open to full-time roles in AI systems and data architecture.",
  employment: "Full-time",
  areas: ["AI systems architecture", "Data architecture"],
  location: "Remote, or on site in the Grand Rapids area.",
  /** The hiring path: where to write, and the two documents to read first. */
  contact: "/contact",
  resume: "/resume",
  pdf: "/resume.pdf",
  asOf: "2026-10-02",
} as const

/** The original site's Core Strengths (lib/resume-data.json at 63d43d0), edited for voice. */
export const STRENGTHS: { title: string; description: string }[] = [
  {
    title: "Full stack",
    description:
      "Software is the primary competency. Curiosity has carried the work across the full spectrum of technology, from physics to generative AI.",
  },
  {
    title: "Always learning",
    description:
      "One is always a student. That mantra is the reason for a standing habit of evaluating new languages and platforms.",
  },
  {
    title: "Inventor",
    description:
      "Turning generative AI into a problem solver, and developing novel tools that interface with the real world.",
  },
]

/** PipeLive, 1997 to 2002: 12 industry awards, of which the record names two. */
export const AWARDS: { award: string; company: string; years: string }[] = [
  { award: "PC Magazine Winner's Circle", company: "PipeLive, LLC", years: "1997 to 2002" },
  { award: "TMC Labs Innovation Award", company: "PipeLive, LLC", years: "1997 to 2002" },
]

/*
 * SysForge.ai since 2026, in four runs. Sources, by run: the platform from the
 * "core" research (repository READMEs and docs, the unified service spec of
 * 2026-10-02, deduplicated git logs); disaster recovery from the "dr"
 * research (the clean-stack plan and its results, the backup design doc, the
 * documented restore test, the replication module's README); MyFinalWishes
 * from the "myfw" research (its repository, package.json, docs and git log);
 * infrastructure from the nginx configuration on this host.
 */
const SYSFORGE_GROUPS: { label: string; bullets: string[] }[] = [
  {
    label: "The platform",
    bullets: [
      "Built a production-ready prototype platform on the SysForge fabric: 84 self-hosted Python services exposing about 3,390 documented endpoints, where every read endpoint is also an MCP tool for connected models. More than 20,000 commits of his own across more than 140 repositories since February 2026, pair-programmed with AI, not counting automated chores and merges.",
      "Designed a journaled state kernel for agents: five classical primitives (frontier, seen set, memo, plan DAG, disjoint groups) behind one loop, where the search strategy is configuration, not code. Every change goes to an append-only journal, so a crashed run replays to its exact next step and a supervisor can read an agent's state without asking it. It ships with a static lint whose three rules were each found first in production graphs.",
      "Built a declarative execution engine that merged three in-house workflow engines into one. Graphs are written as YAML and run once, run durably (a run can sit at an approval gate for days and resume exactly once by replay), or run as long-lived reconcile services.",
      "Built a planner on that engine. Two plain sentences go in. A typed judge picks a catalog template or a model writes a new graph, and a check against the live service catalog rejects any call to an operation that does not exist. Nothing runs until a person clicks Run, and anything that leaves the building waits at an approval gate.",
      "Built the service mesh the platform runs on. Each service announces a card describing itself, peers find each other by broadcast and seed lists, and membership expires by TTL, so a dead node simply ages out. Services are called by name through one gateway.",
      "Built the platform's intelligence crawler: an async jobs API that runs YAML pipelines (crawl, archive retrieval, screenshots, transcripts, vector search), running on a self-built cluster of crawl workers. Its largest measured run processed about 950 GB in nine days.",
    ],
  },
  {
    label: "Disaster recovery",
    bullets: [
      "Rehearsed a from-nothing rebuild of the platform on a second host: fresh secrets, empty schemas for 63 managed databases and 47 storage buckets, one tenant and one admin, then every service walked in dependency order. 67 of 93 units started clean, and the other 26 became tickets grouped by cause.",
      "Turned that rehearsal into the platform's first fresh-host runbook: host preparation, secrets bootstrap, the order of the core services, and a verification checklist, with the layout assumptions that had lived only in people's heads written down.",
      "Designed a whole-server encrypted offsite backup. It splits each disk into chunks that fit a nightly window, caps bandwidth, refuses to run if key material would leave the building, and uses credentials that cannot erase backup history. Seeding is in progress.",
      "Restored a 235 MB database from its nightly backup into a throwaway catalog in 33 seconds and checked the counts against live with no mismatches, then wrote the result up as a reusable restore runbook.",
      "Designed snapshot-based ZFS replication for an embedded database and its file blobs, with a failover guard that refuses to promote a standby that is behind on replication.",
    ],
  },
  {
    label: "MyFinalWishes, shipped through SysForge",
    bullets: [
      "Built MyFinalWishes, a digital estate-planning platform, as its only engineer: rebuilt from an earlier prototype into a single TypeScript application (TanStack Start, React 19, SQLite with Drizzle), 459 commits of his own and 68 schema migrations from July to September 2026.",
      "Designed per-user envelope encryption for identity data and stored files: AES-256-GCM under a per-user key wrapped by a master key held outside the database, each sealed value bound to its user, table and column, and files sealed in 64 KiB chunks so ranged reads stay authenticated.",
      "Took it to production with a replicated standby that can take over, nightly verified off-site backups, and a deep health check that proves sign-in, decryption and mail delivery rather than pinging. About 1,500 automated tests, unit and Playwright end to end, gate every change in CI.",
    ],
  },
  {
    label: "Infrastructure",
    bullets: [
      "Run a multi-domain web estate of more than 50 hostnames on owned hardware, with nginx, systemd, certbot and self-hosted BIND DNS, version-controlled units and encrypted secrets. No cloud host.",
    ],
  },
]

/*
 * The 2026 research and open-source work. Sources: the "core" research's
 * fact-checked bullets for tinymachines.ai, TerraPulse, tinychase and
 * bradley.io; tinymachines/halfphi (README, Cargo.toml) and
 * tinymachines/nes-bench (README) for the two lines that name them; the
 * owner's 2026-10-02 wording for the roles ("architect and builder of
 * TerraPulse", "engineered tinychase").
 */
const RESEARCH_GROUPS: { label: string; bullets: string[] }[] = [
  {
    label: "tinymachines.ai",
    bullets: [
      "Designed and shipped tinymachines.ai in six weeks (763 commits, August 22 to October 2, 2026): one self-hosted site over four projects on Next.js 16, FastAPI and Rust/WebAssembly, with an API spoken as both REST and MCP and documentation in English and Japanese. Its headline figures are read from data files written only by scripts, 42 Playwright specs check the live site, and a deploy is refused when a served WebAssembly bundle does not match its recorded source commit.",
      "Built a transistor-level (switch-level) MOS 6502 simulator in Rust and WebAssembly on halfphi, an MIT-licensed library for switch-level simulation of chips traced from die photographs: 1,725 nodes, 3,510 switches and no behavioural model, matching the visual6502 reference bit for bit on every node across a 3,000 half-cycle trace. It has a WebGL2 die renderer, an HTTP API whose simulation calls are stateless, and an MCP endpoint.",
      "Designed an engine ladder in which each faster engine is derived from the switch-level chip and held to it at the pins: a micro engine at 39.0 M half-cycles a second (about 1,465 times the switch-level engine) and a GPU kernel stepping 128,000 machines at once, with all 289 recorded pin traces replaying exactly and each comparison shown to fail under a deliberate mutation.",
      "Extended the method to the NES: switch-level Ricoh 2A03 and 2C02 chips, an NTSC signal and CRT model, and a console with seven cartridge board types that passes blargg's CPU instruction and timing, sprite-hit and APU test ROMs, across eight public repositories and more than 830 commits in seven weeks.",
      "Built the bench that holds the model to the real console under identical inputs: an inline bridge between an unmodified NES and an original pad (a shift register the console clocks, a microcontroller counting its latch and clock pulses in hardware) and a Raspberry Pi head that drives reset, power and the oscilloscope from scripts.",
    ],
  },
  {
    label: "TerraPulse, architect and builder",
    bullets: [
      "Architected and built TerraPulse, a measured-data climate and geophysical platform: 80 published per-phenomenon indexes holding 14.2M records (8.9M measured events and series plus a 5.3M-entry EPA facility directory), citing 183 upstream datasets from USGS, NOAA, NASA, EPA, USDA and others, on PostgreSQL/PostGIS, DuckDB and Parquet, self-hosted with systemd and nginx.",
      "Designed and shipped its public Model Context Protocol server: 11 read-only tools over the indexes, research workspaces and a 1,353-node knowledge graph, with a machine-generated spec whose examples run against live data, connected to claude.ai as a custom connector.",
    ],
  },
  {
    label: "tinychase, engineered",
    bullets: [
      "Engineered tinychase.com in nine days (128 commits, AI pair-programmed, building on the TerraPulse data lake and model): an installable PWA where DuckDB-WASM range-reads static Parquet and a tinygrad-exported two-layer cyclone transformer runs in the browser on WebGPU, checked against the Python reference on a test storm (0.0000064 kt difference).",
    ],
  },
  {
    label: "bradley.io",
    bullets: [
      "Run bradley.io on owned hardware with no cloud host: a Next.js 16 site with live dashboards fed by real instruments, a public record of every AI working session and what it cost, and a staged deploy with automatic rollback used for more than 400 releases since February 2026.",
    ],
  },
]

/** 2014 to the present. SysForge.ai and the 2026 research role are rebuilt from the 2026-10-02 sources; the rest are the PDF's, in its words. */
export const ROLES: ResumeRole[] = [
  {
    years: "2024 to present",
    title: "Founder and AI Systems Architect",
    company: "SysForge.ai",
    context:
      "AI systems and development firm. Since 2026 the work has centred on a production-ready prototype platform built on the SysForge fabric, on products shipped through it, and on the self-hosted infrastructure under both.",
    bullets: SYSFORGE_GROUPS.flatMap((g) => g.bullets),
    groups: SYSFORGE_GROUPS,
    tech: ["Python", "FastAPI", "TypeScript", "Claude API", "MCP", "SQLite", "ZFS", "WireGuard", "OpenWrt", "systemd", "nginx"],
  },
  {
    years: "2026 to present",
    title: "Research and open source",
    company: "tinymachines.ai, TerraPulse, tinychase",
    context:
      "Chips simulated from die photographs, an open climate and geophysical data platform, and a cyclone model that runs in the browser. Built in public, on owned hardware.",
    bullets: RESEARCH_GROUPS.flatMap((g) => g.bullets),
    groups: RESEARCH_GROUPS,
    links: [
      { label: "tinymachines.ai", href: "https://tinymachines.ai" },
      { label: "6502.tinymachines.ai", href: "https://6502.tinymachines.ai" },
      { label: "terrapulse.info", href: "https://terrapulse.info" },
      { label: "tinychase.com", href: "https://tinychase.com" },
      { label: "github.com/tinymachines", href: "https://github.com/tinymachines" },
    ],
    tech: ["Rust", "WebAssembly", "WebGL2", "WebGPU", "tinygrad", "Next.js", "FastAPI", "PostgreSQL/PostGIS", "DuckDB", "Parquet", "MCP"],
  },
  {
    years: "2022 to present",
    title: "Architect and Developer",
    company: "VictoryText, LLC",
    location: "Grand Rapids, MI",
    context: "Enterprise-grade, high-volume messaging platform with strict uptime and compliance requirements.",
    bullets: [
      "Architected a high-availability messaging platform handling millions of messages at 99.9% uptime, using AI for anomaly detection and delivery optimization.",
      "Developed the RESTful API layer in FastAPI, integrating multiple carriers (Twilio, Bandwidth, Kaleyra, Telnyx) with automated failover.",
      "Engineered DynamoDB operations for atomic queue management, ensuring message delivery guarantees.",
      "Built a real-time analytics backend with AI-driven pattern recognition, aggregating carrier statistics through AWS QuickSight.",
    ],
    tech: ["Python", "FastAPI", "DynamoDB", "Lambda", "CloudWatch", "QuickSight"],
  },
  {
    years: "2018 to 2022",
    title: "Architect and Developer",
    company: "ConservativeConnector, LLC",
    location: "Grand Rapids, MI",
    context: "Large-scale email data management systems processing billions of messages and more than 100 million contact records.",
    bullets: [
      "Designed high-volume data infrastructure on AWS, with ML-driven data quality scoring and deduplication.",
      "Integrated and normalized 4.9 billion data points for ML model training, relationship discovery, and predictive analytics.",
      "Built multi-channel ingestion pipelines with ETL processes shipping to Snowflake, incorporating automated anomaly detection.",
      "Ensured GDPR and CAN-SPAM compliance across all data processing through automated policy enforcement.",
    ],
    tech: ["Python", "AWS", "Snowflake", "PostgreSQL", "ML pipelines", "ETL"],
  },
  {
    years: "2014 to 2018",
    title: "Senior Architect",
    company: "TransUnion, TruLookup Division",
    location: "Boca Raton, FL",
    context:
      "Investigative intelligence platform providing insight on people, assets, and relationships from more than 10,000 data sources. Served law enforcement, government agencies, and legal clients.",
    bullets: [
      "Lead developer on a classified project with the United States Government, covering secure system architecture and federal compliance.",
      "Architected distributed infrastructure processing billions of records and millions of queries a day at better than 99.9% uptime.",
      "Built machine learning models for entity resolution, relationship mapping, and data segmentation with the data science team.",
      "Implemented ML-driven search algorithms connecting disparate data sources to reveal hidden relationships between individuals, businesses, assets, and locations.",
      "Led a team of five developers in search algorithm optimization, performance tuning, and ML model integration.",
    ],
    tech: ["C#", ".NET", "Apache Solr", "Elasticsearch", "SQL Server", "Distributed caching"],
  },
]

/** 1997 to 2014: from the earlier resume data, which the current PDF omits. */
export const EARLIER_ROLES: ResumeRole[] = [
  {
    years: "2012 to 2014",
    title: "Senior Architect",
    company: "nextSource / PeopleTicker",
    location: "Manhattan, NY",
    context: "Talent acquisition automation. PeopleTicker was a start-up spun out of nextSource.",
    bullets: [
      "Senior data engineer on a global, real-time labor-rate calculator: designed the data structures and systems for search-engine data acquisition, processing, and retrieval.",
      "Designed and developed the rate search engine and its algorithms, implemented in Java with Weka and other statistical packages.",
    ],
    tech: ["Java", "Weka", "Apache Solr", "AWS EC2", "RDS"],
  },
  {
    years: "2011 to 2012",
    title: "Application Developer",
    company: "nextSource",
    location: "Manhattan, NY",
    bullets: [
      "Developer on a talent acquisition management system for a provider of temporary labor to large corporations, including Capital One, Caterpillar, and BASF. Human resources teams used it to track sourcing, hiring, and invoicing.",
    ],
    tech: ["PHP", "Oracle", "JavaScript"],
  },
  {
    years: "2009 to 2011",
    title: "Senior Developer",
    company: "Linx Communications, Inc.",
    location: "Hauppauge, NY",
    context: "Digital marketing.",
    bullets: [
      "Designed and coded e-commerce sites, including a packing algorithm that fits any number of packages into boxes of several sizes.",
      "Integrated Magento with an ERP system through a custom bridge to the Magento API, and maintained all code and production servers.",
    ],
    tech: ["Magento", "Twitter API", "Google Analytics"],
  },
  {
    years: "2008",
    title: "Software Development and System Design",
    company: "J. Lack Consulting",
    location: "East Hampton, NY",
    bullets: [
      "Maintained production e-commerce servers, ran daily email marketing sends, and analyzed response. Managed an e-commerce integration project for a wine retailer end to end.",
      "Designed a secure network for a 120-bed healthcare facility, built to meet HIPAA requirements and protect patient data.",
    ],
  },
  {
    years: "2008",
    title: "Senior Developer",
    company: "EnablePay, Inc.",
    location: "Mineola, NY",
    context: "Credit card processing start-up.",
    bullets: [
      "Created a merchant transaction management system, supervising other developers and ensuring daily card transactions cleared the banking system.",
      "Developed a web-based merchant application in PHP, integrated with SugarCRM over SOAP.",
    ],
  },
  {
    years: "2007 to 2008",
    title: "Senior Developer",
    company: "AmeriCorp, Inc.",
    location: "Syosset, NY",
    context: "Debt consolidation.",
    bullets: [
      "Developed the financial backend of an enterprise compensation management system: it receives and disburses client funds to escrow accounts and generates outbound messages from account status.",
      "Planned a 500-seat call center installation on Microsoft CRM and designed an automated EFT scheduling system for daily ACH processing.",
      "Designed and implemented a SOAP API for business partners to reach the back-end processing system.",
    ],
  },
  {
    years: "2005 to 2007",
    title: "Senior Developer",
    company: "Evo Merchant Services, Inc.",
    location: "Melville, NY",
    context: "Credit card processor.",
    bullets: [
      "Developed a multi-user credit card risk management system used by employees and external partners, which reduced company losses by detecting fraudulent card activity.",
      "Created file processors to load card transaction data from Visa, MasterCard, American Express, and Discover.",
      "Developed an in-house system for managing more than 100,000 merchants, from sales through onboarding.",
    ],
  },
  {
    years: "2004 to 2005",
    title: "Senior Developer",
    company: "Direct Insite, Inc.",
    location: "Hauppauge, NY",
    context: "Invoicing services for IBM.",
    bullets: [
      "Designed a management console for a just-in-time processing system that rendered XML datasets with XSLT.",
      "Developed a C# framework giving programmers a common interface for dynamic data processing modules, and an application processing real-time financial feeds from IBM Japan.",
    ],
    tech: ["C#", ".NET", "SQL Server"],
  },
  {
    years: "2002 to 2004",
    title: "Senior Developer",
    company: "CCSI",
    location: "Hauppauge, NY",
    context: "Technology contractor.",
    bullets: [
      "Developed a case management system for the Suffolk County District Attorney, ingesting more than 100,000 court indictments and dispositions.",
      "Built a HIPAA-compliant medical permissions program for Nassau University Medical Center, converting existing data into a browser-based application.",
      "Designed modules for a browser-based knowledge system for school districts.",
    ],
    tech: ["C#", ".NET", "Oracle"],
  },
  {
    years: "1997 to 2002",
    title: "Chief Technology Officer and co-founder",
    company: "PipeLive, LLC",
    location: "Melville, NY",
    context: "Real-time chat and collaboration software, sold as a service.",
    bullets: [
      "Co-founded the company and designed and developed a modular suite of real-time collaboration software.",
      "Received 12 industry awards, including PC Magazine's Winner's Circle and the TMC Labs Innovation Award.",
      "Negotiated a four-year, $2M reseller agreement with Siemens AG distributing Web Interaction Center worldwide, and managed integration with Siemens Switzerland's call center product line.",
      "Worked on an early AI-based chat system with Banter, Inc. for LaSalle Bank.",
    ],
  },
]

export const GOVERNMENT: string[] = [
  "Lead developer on a classified project with the United States Government (TransUnion TruLookup, 2014 to 2018).",
  "Extensive experience in secure environments handling sensitive investigative and personal data for law enforcement and federal agencies.",
  "Working knowledge of data protection protocols, federal compliance frameworks, FISMA, and security practice.",
]

export const EXPERTISE: { area: string; items: string[] }[] = [
  {
    area: "AI and machine learning",
    items: [
      "Claude and the Anthropic API",
      "Model Context Protocol (MCP)",
      "Agent state and orchestration",
      "OpenAI API",
      "Agentic frameworks",
      "Prompt engineering",
      "RAG pipelines",
      "Vector databases",
      "Hugging Face",
      "Entity resolution",
      "Relationship mapping",
      "Recommendation engines",
      "Statistical modeling",
      "scikit-learn",
      "Weka",
    ],
  },
  {
    area: "Languages",
    items: ["Python", "Bash", "SQL", "C# and .NET", "Rust", "C and C++", "Java", "JavaScript and TypeScript"],
  },
  {
    area: "Cloud and infrastructure",
    items: [
      "AWS",
      "Linux administration",
      "Docker",
      "Distributed systems",
      "High-availability design",
      "Load balancing",
      "Disaster recovery",
      "WireGuard and OpenWrt",
      "ZFS",
      "nginx, systemd and BIND",
    ],
  },
  {
    area: "Data and search",
    items: [
      "Snowflake",
      "PostgreSQL",
      "MySQL",
      "SQL Server",
      "DynamoDB",
      "Redis",
      "Elasticsearch",
      "Apache Solr",
      "ETL pipelines",
      "Hadoop and Hive",
      "Vector embeddings",
      "SQLite",
      "DuckDB and Parquet",
      "PostGIS",
    ],
  },
  {
    area: "Development",
    items: ["FastAPI", "REST APIs", "Microservices", "Git", "CI/CD", "Message queues", "Real-time processing"],
  },
]

export const EDUCATION: { what: string; where: string }[] = [
  { what: "Advanced Object-Oriented Programming", where: "Columbia University" },
  { what: "Computer Science coursework", where: "Plymouth State College" },
  { what: "Physics Engineering", where: "University of Buffalo" },
]

/** Open-source work the PDF names, with a link where one exists. */
export const PROJECTS: { name: string; what: string; href?: string; internal?: boolean }[] = [
  {
    name: "bradley.io AI pilot",
    what: "A public record of AI-augmented development: every working session, the models used, and what it cost.",
    href: "/ai-pilot",
    internal: true,
  },
  {
    name: "Sovereign",
    what: "An assembly-like agentic programming language designed for self-improving AI systems.",
    href: "https://github.com/tinymachines/sovereign",
  },
  {
    name: "Gene Pool",
    what: "A curated archive and analysis of AI coding agent system prompts across frontier models.",
  },
  { name: "ARI", what: "An AWS resource inventory tool." },
  { name: "ESP32 AI Edge", what: "Edge computing and embedded inference on ESP32 mesh networks." },
  { name: "Rust for Haters", what: "Systems programming deep-dives." },
]
