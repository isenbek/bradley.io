import type { BenchItem } from "@/components/projects/BenchCard"

/**
 * The client projects: platforms I architected and build for other people.
 *
 * The owner's list (2026-10-04): TerraPulse, tinychase, Nominate.AI,
 * campaignbrain.dev and MyFW. They live on bradley.io only, never on
 * meatball.ai, which is the lab. SysForge is not here: it is a lab site,
 * reached through meatball.ai.
 *
 * Four of these cards moved here from /projects with their words unchanged.
 * Campaign Brain's is new and uses its own homepage's description.
 *
 * FEATURED are the two platforms the others sit on or beside, printed
 * larger in a pair; MORE fills one row of three under them.
 */
export const CLIENTS_FEATURED: BenchItem[] = [
  {
    href: "https://terrapulse.info",
    title: "TerraPulse",
    kind: "data platform",
    line: "A measured-data platform for climate and geophysical data: readings from public instruments, and no models, forecasts or reanalysis. It serves the same records to AI agents through a public, read-only MCP server. I am its architect.",
    tech: ["Python", "FastAPI", "PostgreSQL + PostGIS", "Parquet", "MCP"],
    more: [
      { href: "https://terrapulse.info/mcp", label: "The MCP server" },
      { href: "/papers", label: "Research notes, here" },
    ],
  },
  {
    // Its own homepage's words (campaignbrain.dev, 2026-10-04). The services
    // it lists are its own schema.org serviceType entries.
    href: "https://campaignbrain.dev",
    title: "Campaign Brain",
    kind: "data platform",
    line: "Bespoke data tools for small and mid-size political shops: one shared data platform in place of a tangle of vendors, with voter files, communications, analytics and workflows under one roof, and quick custom dashboards built on top. I architected it and build it.",
    tech: ["Python", "FastAPI", "DuckDB", "MCP"],
  },
]

export const CLIENTS_MORE: BenchItem[] = [
  {
    href: "https://tinychase.com",
    title: "tinychase",
    kind: "web app",
    line: "Small models on measured public data, run entirely in your browser: DuckDB-WASM reads Parquet over ranged requests, and an experimental cyclone model runs on your own GPU through WebGPU. I engineered it.",
    tech: ["DuckDB-WASM", "WebGPU", "tinygrad", "PWA"],
  },
  {
    // Its own homepage's words (nominate.ai, 2026-10-02); the owner's framing
    // that it is built on the SysForge platform. Served from this box.
    href: "https://nominate.ai",
    title: "Nominate.AI",
    kind: "search platform",
    line: "The political web, searchable: crawls, broadcast transcripts, county filings and OCR'd scans harvested into one corpus you can ask a question of, with the source document attached to every answer. Built on the SysForge platform and served from this machine.",
    tech: ["Python", "FastAPI", "OCR", "Vector search", "MCP"],
  },
  {
    // Named, never linked (owner's rule, 2026-10-02): the card opens the
    // resume entry, not the product's live site.
    href: "/resume",
    title: "MyFinalWishes",
    kind: "product",
    state: "production-ready",
    line: "A digital estate-planning platform shipped through SysForge, rebuilt from an earlier prototype into one TypeScript application, with per-user envelope encryption for identity data and every stored file. The live site is not linked here; the resume has the detail.",
    tech: ["TanStack Start", "React 19", "SQLite + Drizzle", "AES-256-GCM"],
  },
]
