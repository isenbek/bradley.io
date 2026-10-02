/**
 * The resume, made queryable: the plain JSON document behind /api/resume and
 * the Model Context Protocol server behind /api/resume/mcp.
 *
 * Everything here is read from lib/resume.ts. This file adds no claim of its
 * own except the line that compensation is not published (owner, 2026-10-02);
 * availability and location come from R.AVAILABILITY, with the owner's words
 * as a fallback only if those fields are ever emptied.
 *
 * Transport: Streamable HTTP, stateless. One JSON-RPC 2.0 message (or a small
 * batch) per POST, answered with application/json. No session id is issued and
 * no SSE stream is offered, which the spec allows: a GET asking for an event
 * stream gets 405, any other GET gets a short description in plain text.
 *
 * Hand-written on purpose. The site keeps its runtime dependencies small, and
 * the protocol surface a read-only server needs (initialize, ping, tools/list,
 * tools/call) is small enough to read in one sitting.
 *
 * What never leaves this file: a salary or a range, a phone number, a home
 * address, or anything about how this host is built. get_contact says how to
 * reach a person, and compensation is a conversation.
 */

import * as R from "@/lib/resume"
import type { ResumeRole } from "@/lib/resume"

export const SITE = "https://bradley.io"
export const MCP_PATH = "/api/resume/mcp"
export const JSON_PATH = "/api/resume"

const abs = (href: string) => (/^https?:\/\//.test(href) ? href : `${SITE}${href}`)

// ---------------------------------------------------------------------------
// Availability (owner, 2026-10-02), as lib/resume.ts states it
// ---------------------------------------------------------------------------

const text = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v : fallback)

/** Owner, 2026-10-02: "Yes, say it plainly." */
export const AVAILABILITY = text(
  R.AVAILABILITY.statement,
  "Open to full-time roles in AI systems and data architecture."
)

/** Owner, 2026-10-02: remote, or on site in the Grand Rapids area. */
export const WORK_LOCATION = text(R.AVAILABILITY.location, "Remote, or on site in the Grand Rapids area.")

/**
 * The structured half of AVAILABILITY, copied field by field so that nothing
 * added to that object later reaches an agent without a decision here. It has
 * no pay field and this never adds one.
 */
function availabilityDetail() {
  const a = R.AVAILABILITY
  return {
    open: a.open,
    statement: AVAILABILITY,
    employment: a.employment,
    areas: [...a.areas],
    location: WORK_LOCATION,
    asOf: a.asOf,
    contactPage: abs(a.contact),
    resumePage: abs(a.resume),
    resumePdf: abs(a.pdf),
  }
}

const COMPENSATION =
  "Not published. Compensation is discussed in a conversation; write to the address in get_contact."

const NAME = "Bradley S. Isenbek"

// ---------------------------------------------------------------------------
// The resume as one document
// ---------------------------------------------------------------------------

export interface RoleOut extends ResumeRole {
  start: number
  end: number
  current: boolean
}

/** "2024 to present" -> 2024..this year; "2008" -> 2008..2008. */
function span(years: string): { start: number; end: number; current: boolean } {
  const nums = (years.match(/\d{4}/g) ?? []).map(Number)
  const current = /present/i.test(years)
  const start = nums[0] ?? 0
  const end = current ? new Date().getUTCFullYear() : (nums[nums.length - 1] ?? start)
  return { start, end, current }
}

function allRoles(): RoleOut[] {
  return [...R.ROLES, ...R.EARLIER_ROLES].map((r) => ({ ...r, ...span(r.years) }))
}

function contact() {
  return {
    name: NAME,
    email: "brad@bradley.io",
    site: SITE,
    contactPage: `${SITE}/contact`,
    github: ["https://github.com/isenbek", "https://github.com/tinymachines"],
    resumePage: `${SITE}/resume`,
    resumePdf: abs(R.RESUME_PDF),
    resumeJson: `${SITE}${JSON_PATH}`,
    compensation: COMPENSATION,
  }
}

function projects() {
  return R.PROJECTS.map((p) => ({
    name: p.name,
    what: p.what,
    evidence: p.href ? abs(p.href) : null,
  }))
}

/** The labelled runs of work inside a role (the platform, TerraPulse, ...). */
function workstreams() {
  return allRoles().flatMap((r) =>
    (r.groups ?? []).map((g) => ({
      name: g.label,
      role: r.title,
      company: r.company,
      years: r.years,
      summary: g.bullets[0] ?? "",
      bullets: g.bullets.length,
    }))
  )
}

/** Public pages a role names, as evidence. */
function publicWork() {
  return allRoles().flatMap((r) =>
    (r.links ?? []).map((l) => ({ label: l.label, url: abs(l.href), role: r.title, company: r.company, years: r.years }))
  )
}

export function resumeDocument(generated = new Date().toISOString()) {
  return {
    generated,
    updated: R.RESUME_UPDATED,
    name: NAME,
    headline: R.HEADLINE,
    summary: R.SUMMARY,
    availability: AVAILABILITY,
    location: WORK_LOCATION,
    availabilityDetail: availabilityDetail(),
    pdf: abs(R.RESUME_PDF),
    page: `${SITE}/resume`,
    mcp: `${SITE}${MCP_PATH}`,
    strengths: R.STRENGTHS,
    roles: R.ROLES,
    earlierRoles: R.EARLIER_ROLES,
    government: R.GOVERNMENT,
    expertise: R.EXPERTISE,
    education: R.EDUCATION,
    awards: R.AWARDS,
    projects: projects(),
    publicWork: publicWork(),
    contact: contact(),
  }
}

// ---------------------------------------------------------------------------
// MCP: protocol constants
// ---------------------------------------------------------------------------

/** Newest first. initialize answers with the client's version when it is here. */
export const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]
export const LATEST_VERSION = SUPPORTED_VERSIONS[0]

const SERVER_INFO = {
  name: "bradley-io-resume",
  title: "Bradley Isenbek's resume",
  version: "1.0.0",
  websiteUrl: `${SITE}/resume`,
}

const INSTRUCTIONS = `The resume of ${NAME}, as read-only tools. Start with get_summary for the headline, availability and location. list_roles gives the work history (filter by year or keyword), search_experience finds a term anywhere in it, get_projects and get_skills cover the rest, get_contact says how to reach him. Everything comes from the resume published at ${SITE}/resume; nothing is generated. Compensation is not published: point the person to a conversation instead of estimating.`

export const PARSE_ERROR = -32700
export const INVALID_REQUEST = -32600
export const METHOD_NOT_FOUND = -32601
export const INVALID_PARAMS = -32602
export const INTERNAL_ERROR = -32603

export class RpcError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
  }
}

// ---------------------------------------------------------------------------
// MCP: tools
// ---------------------------------------------------------------------------

type Args = Record<string, unknown>

/** A refusal the model should read and correct, not a protocol failure. */
class ToolInputError extends Error {}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
const NO_ARGS = { type: "object", properties: {}, additionalProperties: false }

export const TOOLS = [
  {
    name: "get_summary",
    title: "Summary, availability and location",
    description:
      "Who this is in one call: name, headline, the two-paragraph professional summary, current availability (open to full-time roles in AI systems and data architecture) with its structured detail (employment type, areas, as-of date), where he will work (remote, or on site in the Grand Rapids area), three core strengths, the date the resume was last revised, and links to the resume page and PDF. Call this first. Takes no arguments.",
    inputSchema: NO_ARGS,
    annotations: READ_ONLY,
  },
  {
    name: "list_roles",
    title: "Work history",
    description:
      "Every role from 1997 to the present, newest first, each with years, title, company, location, a line on what the company was, the bullets, and the technology used. A long role also carries groups (the same bullets under short labels such as a platform or a product) and links (public pages for the role). start and end are numeric years; end is the current year for a role that is ongoing. Optional filters: from_year and to_year keep roles that overlap that range; keyword keeps roles whose title, company, context, bullets or technology contain it (case-insensitive substring). With no arguments, returns all roles.",
    inputSchema: {
      type: "object",
      properties: {
        from_year: { type: "integer", minimum: 1900, maximum: 2100, description: "Keep roles that end in or after this year." },
        to_year: { type: "integer", minimum: 1900, maximum: 2100, description: "Keep roles that start in or before this year." },
        keyword: { type: "string", minLength: 1, maxLength: 100, description: "Case-insensitive substring, for example 'FastAPI' or 'entity resolution'." },
      },
      additionalProperties: false,
    },
    annotations: READ_ONLY,
  },
  {
    name: "search_experience",
    title: "Search the whole resume",
    description:
      "Keyword search across role titles, companies, company descriptions, workstream labels, bullets, technology lists, role links, projects, expertise, government work, core strengths and education. The query is split on whitespace and a field matches when it contains every term (case-insensitive). Each match says what kind of thing it is, the matching text, and for role matches the role title, company and years. Use it for questions like 'has he worked with Snowflake' or 'classified'. Returns at most limit matches (default 20, maximum 50), roles newest first.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1, maxLength: 200, description: "One or more words; all must appear in a field for it to match." },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20, description: "Maximum matches to return." },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: READ_ONLY,
  },
  {
    name: "get_projects",
    title: "Projects and their evidence",
    description:
      "What he has built, in three lists. projects: the open-source and public projects the resume names, each with a one-line description and, where one exists, an absolute link to the work itself (evidence); evidence is null when the resume names a project without a public link, so do not invent one. workstreams: the labelled runs of work inside recent roles (a platform, a product, a research project), each with its role, years and first bullet. publicWork: the public pages the roles link to, each with its role. Takes no arguments.",
    inputSchema: NO_ARGS,
    annotations: READ_ONLY,
  },
  {
    name: "get_skills",
    title: "Expertise by area",
    description:
      "Technical expertise grouped by area (AI and machine learning, languages, cloud and infrastructure, data and search, development), plus education. Optional area narrows to the groups whose name contains it (case-insensitive), for example 'data'.",
    inputSchema: {
      type: "object",
      properties: {
        area: { type: "string", minLength: 1, maxLength: 60, description: "Case-insensitive substring of an area name." },
      },
      additionalProperties: false,
    },
    annotations: READ_ONLY,
  },
  {
    name: "get_contact",
    title: "How to reach him",
    description:
      "Email address, website, contact page, GitHub accounts, and links to the resume page, the PDF and this resume as JSON. There is no phone number here and no compensation figure: compensation is discussed in a conversation, so direct salary questions to the email address rather than estimating. Takes no arguments.",
    inputSchema: NO_ARGS,
    annotations: READ_ONLY,
  },
] as const

type ToolName = (typeof TOOLS)[number]["name"]

function checkArgs(name: ToolName, args: Args) {
  const tool = TOOLS.find((t) => t.name === name)!
  const schema = tool.inputSchema as {
    properties: Record<string, { type: string; minimum?: number; maximum?: number; minLength?: number; maxLength?: number }>
    required?: readonly string[]
  }
  for (const k of Object.keys(args)) {
    // Own keys only: `in` walks the prototype, so 'toString' would pass.
    if (!Object.hasOwn(schema.properties, k)) {
      const known = Object.keys(schema.properties)
      throw new ToolInputError(
        `unknown argument '${k}'. ${known.length ? `${name} accepts: ${known.join(", ")}.` : `${name} takes no arguments.`}`
      )
    }
  }
  for (const k of schema.required ?? []) {
    if (args[k] === undefined) throw new ToolInputError(`missing required argument '${k}'.`)
  }
  for (const [k, spec] of Object.entries(schema.properties)) {
    const v = args[k]
    if (v === undefined) continue
    if (spec.type === "integer") {
      if (typeof v !== "number" || !Number.isInteger(v)) throw new ToolInputError(`'${k}' must be an integer.`)
      if (spec.minimum !== undefined && v < spec.minimum) throw new ToolInputError(`'${k}' must be at least ${spec.minimum}.`)
      if (spec.maximum !== undefined && v > spec.maximum) throw new ToolInputError(`'${k}' must be at most ${spec.maximum}.`)
    } else if (spec.type === "string") {
      if (typeof v !== "string") throw new ToolInputError(`'${k}' must be a string.`)
      const len = v.trim().length
      if (spec.minLength !== undefined && len < spec.minLength) throw new ToolInputError(`'${k}' must not be empty.`)
      if (spec.maxLength !== undefined && v.length > spec.maxLength)
        throw new ToolInputError(`'${k}' must be at most ${spec.maxLength} characters.`)
    }
  }
}

const has = (hay: string | undefined, needle: string) =>
  !!hay && hay.toLowerCase().includes(needle.toLowerCase())

function roleText(r: ResumeRole): string[] {
  return [r.title, r.company, r.context ?? "", ...r.bullets, ...(r.tech ?? [])]
}

function getSummary() {
  return {
    name: NAME,
    headline: R.HEADLINE,
    summary: R.SUMMARY,
    availability: AVAILABILITY,
    location: WORK_LOCATION,
    availabilityDetail: availabilityDetail(),
    strengths: R.STRENGTHS,
    updated: R.RESUME_UPDATED,
    resumePage: `${SITE}/resume`,
    resumePdf: abs(R.RESUME_PDF),
  }
}

function listRoles(args: Args) {
  const from = args.from_year as number | undefined
  const to = args.to_year as number | undefined
  const kw = (args.keyword as string | undefined)?.trim()
  if (from !== undefined && to !== undefined && from > to)
    throw new ToolInputError("'from_year' is after 'to_year'.")
  const roles = allRoles().filter(
    (r) =>
      (from === undefined || r.end >= from) &&
      (to === undefined || r.start <= to) &&
      (!kw || roleText(r).some((t) => has(t, kw)))
  )
  return { count: roles.length, filters: { from_year: from ?? null, to_year: to ?? null, keyword: kw ?? null }, roles }
}

interface Match {
  kind: "role" | "project" | "expertise" | "government" | "strength" | "education"
  field: string
  text: string
  role?: string
  company?: string
  years?: string
  area?: string
  evidence?: string | null
}

function searchExperience(args: Args) {
  const query = (args.query as string).trim()
  const limit = (args.limit as number | undefined) ?? 20
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const hit = (s: string | undefined) => !!s && terms.every((t) => s.toLowerCase().includes(t))
  const out: Match[] = []

  for (const r of allRoles()) {
    const at = { role: r.title, company: r.company, years: r.years }
    if (hit(r.title)) out.push({ kind: "role", field: "title", text: r.title, ...at })
    if (hit(r.company)) out.push({ kind: "role", field: "company", text: r.company, ...at })
    if (hit(r.context)) out.push({ kind: "role", field: "context", text: r.context!, ...at })
    for (const g of r.groups ?? [])
      if (hit(g.label)) out.push({ kind: "role", field: "workstream", text: g.label, ...at })
    for (const b of r.bullets) if (hit(b)) out.push({ kind: "role", field: "bullet", text: b, ...at })
    for (const l of r.links ?? [])
      if (hit(l.label) || hit(l.href))
        out.push({ kind: "role", field: "link", text: l.label, evidence: abs(l.href), ...at })
    const tech = (r.tech ?? []).filter(hit)
    if (tech.length) out.push({ kind: "role", field: "tech", text: tech.join(", "), ...at })
  }
  for (const p of projects()) {
    if (hit(p.name) || hit(p.what))
      out.push({ kind: "project", field: "project", text: `${p.name}: ${p.what}`, evidence: p.evidence })
  }
  for (const g of R.EXPERTISE) {
    const items = g.items.filter(hit)
    if (hit(g.area)) out.push({ kind: "expertise", field: "area", text: g.items.join(", "), area: g.area })
    else if (items.length) out.push({ kind: "expertise", field: "items", text: items.join(", "), area: g.area })
  }
  for (const g of R.GOVERNMENT) if (hit(g)) out.push({ kind: "government", field: "government", text: g })
  for (const s of R.STRENGTHS)
    if (hit(s.title) || hit(s.description))
      out.push({ kind: "strength", field: "strength", text: `${s.title}: ${s.description}` })
  for (const e of R.EDUCATION) {
    const line = `${e.what}, ${e.where}`
    if (hit(line)) out.push({ kind: "education", field: "education", text: line })
  }

  return { query, total: out.length, returned: Math.min(out.length, limit), matches: out.slice(0, limit) }
}

function getSkills(args: Args) {
  const area = (args.area as string | undefined)?.trim()
  const groups = area ? R.EXPERTISE.filter((g) => has(g.area, area)) : R.EXPERTISE
  if (area && !groups.length)
    throw new ToolInputError(
      `no area matches '${area}'. Areas: ${R.EXPERTISE.map((g) => g.area).join("; ")}.`
    )
  return { expertise: groups, education: R.EDUCATION }
}

const IMPLS: Record<ToolName, (a: Args) => Record<string, unknown>> = {
  get_summary: getSummary,
  list_roles: listRoles,
  search_experience: searchExperience,
  get_projects: () => ({ projects: projects(), workstreams: workstreams(), publicWork: publicWork() }),
  get_skills: getSkills,
  get_contact: contact,
}

function callTool(params: Args) {
  const name = params.name
  if (typeof name !== "string" || !Object.hasOwn(IMPLS, name)) {
    throw new RpcError(INVALID_PARAMS, `unknown tool: ${typeof name === "string" ? name.slice(0, 60) : String(name)}`, {
      tools: TOOLS.map((t) => t.name),
    })
  }
  const raw = params.arguments ?? {}
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    throw new RpcError(INVALID_PARAMS, "arguments must be an object")
  const args = raw as Args
  try {
    checkArgs(name as ToolName, args)
    const result = IMPLS[name as ToolName](args)
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 1) }],
      structuredContent: result,
      isError: false,
    }
  } catch (e) {
    // Bad input to a tool is answered as a tool result with isError, so the
    // model reads the reason and retries (the 2025-11-25 spec's guidance);
    // a JSON-RPC error would go to the client and the model would never see it.
    if (e instanceof ToolInputError)
      return { content: [{ type: "text", text: `Invalid arguments: ${e.message}` }], isError: true }
    throw new RpcError(INTERNAL_ERROR, "the tool failed")
  }
}

// ---------------------------------------------------------------------------
// MCP: one message in, one response out
// ---------------------------------------------------------------------------

type Id = string | number
export interface RpcResponse {
  jsonrpc: "2.0"
  id: Id | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

export const rpcError = (id: Id | null, code: number, message: string, data?: unknown): RpcResponse => ({
  jsonrpc: "2.0",
  id,
  error: data === undefined ? { code, message } : { code, message, data },
})

/** Returns null for a notification (or a response a client sent us): no body owed. */
export function handleMessage(msg: unknown): RpcResponse | null {
  if (typeof msg !== "object" || msg === null || Array.isArray(msg))
    return rpcError(null, INVALID_REQUEST, "a JSON-RPC message must be an object")
  const m = msg as Record<string, unknown>
  const hasId = "id" in m
  const idOk = typeof m.id === "string" || (typeof m.id === "number" && Number.isFinite(m.id))
  const id: Id | null = idOk ? (m.id as Id) : null

  if (m.jsonrpc !== "2.0") return rpcError(id, INVALID_REQUEST, "jsonrpc must be \"2.0\"")
  // A client answering a request of ours. We never send any, so there is
  // nothing to match it to, and a response must not be answered.
  if (!("method" in m) && ("result" in m || "error" in m)) return null
  if (typeof m.method !== "string" || !m.method) return rpcError(id, INVALID_REQUEST, "method must be a non-empty string")
  if (hasId && !idOk) return rpcError(null, INVALID_REQUEST, "id must be a string or a number")

  const method = m.method
  const isNotification = !hasId
  if (isNotification) return null // notifications/initialized, cancelled, and anything else: no reply

  const params = m.params ?? {}
  if (typeof params !== "object" || params === null || Array.isArray(params))
    return rpcError(id, INVALID_PARAMS, "params must be an object")
  const p = params as Args

  try {
    let result: unknown
    switch (method) {
      case "initialize": {
        const want = p.protocolVersion
        result = {
          protocolVersion:
            typeof want === "string" && SUPPORTED_VERSIONS.includes(want) ? want : LATEST_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        }
        break
      }
      case "ping":
        result = {}
        break
      case "tools/list":
        result = { tools: TOOLS }
        break
      case "tools/call":
        result = callTool(p)
        break
      default:
        return rpcError(id, METHOD_NOT_FOUND, `method not found: ${method.slice(0, 60)}`)
    }
    return { jsonrpc: "2.0", id: id as Id, result }
  } catch (e) {
    if (e instanceof RpcError) return rpcError(id, e.code, e.message, e.data)
    return rpcError(id, INTERNAL_ERROR, "internal error")
  }
}

/** Plain text for a person who opens the endpoint in a browser. */
export function describe(): string {
  return [
    `Bradley Isenbek's resume, as a Model Context Protocol server.`,
    ``,
    `Endpoint:   ${SITE}${MCP_PATH}`,
    `Transport:  Streamable HTTP. POST one JSON-RPC 2.0 message; the answer is application/json.`,
    `            Stateless: no session id, no event stream. No authentication.`,
    `Protocol:   ${SUPPORTED_VERSIONS.join(", ")} (initialize answers with yours if it is listed, else ${LATEST_VERSION}).`,
    ``,
    `Tools:`,
    ...TOOLS.map((t) => `  ${t.name.padEnd(18)} ${t.title}`),
    ``,
    `Try it:`,
    `  curl -s ${SITE}${MCP_PATH} -H 'Content-Type: application/json' \\`,
    `    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_summary"}}'`,
    ``,
    `The same resume as one JSON document: ${SITE}${JSON_PATH}`,
    `As a PDF: ${abs(R.RESUME_PDF)}`,
    `For people: ${SITE}/resume`,
    ``,
  ].join("\n")
}

/** How /mcp lists this server until the nightly catalog script probes it. */
export const RESUME_MCP_LISTING = {
  id: "resume",
  name: "Resume",
  url: `${SITE}${MCP_PATH}`,
  transport: "streamable HTTP",
  auth: "None",
  what: "My resume for AI agents: summary and availability, the work history since 1997, keyword search across all of it, projects with links, skills, and how to reach me.",
  // Served by this same application, so if this page renders, so does it.
  reachable: true,
  tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
}
