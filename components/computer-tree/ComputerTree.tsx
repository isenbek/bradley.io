"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { ComputerTreeData, Relation } from "@/lib/computer-tree"

/**
 * ComputerTree: the 1961 Computer Tree and its extension to 2025, drawn as the
 * chart was, radially, with ENIAC at the trunk.
 *
 *   <ComputerTree data={computerTree()} />
 *
 * GEOMETRY comes from lib/computer-tree.ts, computed on the server. This file
 * only draws it and answers the reader.
 *
 * ENCODING. Two hues and nothing else carries identity:
 *   ocean  a machine transcribed from the 1961 chart
 *   burnt  a machine added in the extension (1960 to 2025)
 * A dashed link is one the data card marks `approx`: estimated, not read off
 * the chart or established history. 79% of the 1961 links are dashed, and the
 * picture should say so rather than hide it. Blue is ACTIVE, as everywhere in
 * the kit: the selected machine and its line back to its root.
 * Cross-links (second parents, 80 of them) wear mustard, and only on request,
 * because 80 extra curves turn the tree into a hairball.
 *
 * TEXT. Labels are drawn in glass ink with a panel halo, never in a series
 * colour. Their size is fixed in screen pixels: the drawing measures its own
 * scale and divides, so a label reads the same at 1x on a desk and at 4x on a
 * phone.
 *
 * THE PATH NOT TAKEN. 542 focusable dots would be 542 tab stops. The keyboard
 * route is the search field and the lineage list, which are buttons.
 */

const LANDMARKS = new Set([
  "eniac",
  "univac_i",
  "ibm_701",
  "dec_pdp_1",
  "ibm_system_360",
  "cray_1",
  "intel_4004",
  "xerox_alto",
  "ibm_pc",
  "iphone",
  "fugaku",
  "nvidia_h100",
])

const DEFAULT_ID = "fugaku"

const REL: Record<Relation, string> = {
  successor: "successor",
  derived: "derived from",
  uses_cpu: "uses the CPU",
  influence: "influenced by",
  compatible: "compatible with",
}

const ZOOMS = [1, 2, 4] as const

export function ComputerTree({ data }: { data: ComputerTreeData }) {
  const { nodes, links, rings, extent } = data
  const ids = useId()
  const [sel, setSel] = useState(() => Math.max(0, nodes.findIndex((n) => n.id === DEFAULT_ID)))
  const [hover, setHover] = useState(-1)
  const [cross, setCross] = useState(false)
  const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(1)
  const [query, setQuery] = useState("")
  const boxRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // Screen pixels per drawing unit, so labels and dots keep a fixed size.
  const [ppu, setPpu] = useState(0.6)

  const pad = 70
  const span = (extent + pad) * 2

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const ro = new ResizeObserver(() => setPpu(svg.getBoundingClientRect().width / span))
    ro.observe(svg)
    return () => ro.disconnect()
  }, [span])

  const byLabel = useMemo(() => {
    const m = new Map<string, number>()
    nodes.forEach((n, i) => m.set(n.label.toLowerCase(), i))
    return m
  }, [nodes])

  const linksOf = useMemo(() => {
    const into: number[][] = nodes.map(() => [])
    const out: number[][] = nodes.map(() => [])
    links.forEach((l, k) => {
      into[l.t].push(k)
      out[l.s].push(k)
    })
    return { into, out }
  }, [nodes, links])

  // The line back to the root, through primary parents: [selected, ..., root].
  const line = useMemo(() => {
    const out: number[] = []
    for (let i = sel; i !== -1; i = nodes[i].parent) out.push(i)
    return out
  }, [sel, nodes])
  const onLine = useMemo(() => new Set(line), [line])

  // Keep the selection in view inside the drawing's own scroll box.
  useEffect(() => {
    const box = boxRef.current
    if (!box || zoom === 1) return
    const n = nodes[sel]
    const w = box.scrollWidth
    const x = ((n.x + span / 2) / span) * w
    const y = ((n.y + span / 2) / span) * w
    box.scrollTo({ left: x - box.clientWidth / 2, top: y - box.clientHeight / 2, behavior: "smooth" })
  }, [sel, zoom, nodes, span])

  const px = 1 / ppu
  // A phone at 1x shows the whole tree in under 300 px: dots shrink, and the
  // landmark labels wait for a zoom, or they would cover the tree they name.
  const small = ppu < 0.35
  const fs = (small ? 10 : 11) * px
  const dot = Math.max(2.2, (small ? 1.6 : 3.2) * px)

  const pick = (q: string) => {
    setQuery(q)
    const i = byLabel.get(q.trim().toLowerCase())
    if (i !== undefined) setSel(i)
  }

  const s = nodes[sel]
  const parents = linksOf.into[sel].map((k) => links[k])
  const children = linksOf.out[sel].map((k) => links[k])
  const generations = line.length - 1

  const label = (i: number, strong: boolean) => {
    const n = nodes[i]
    // Labels sit on the outside of their dot, along the spoke.
    const r = Math.hypot(n.x, n.y) || 1
    const right = n.x >= 0
    const dx = (n.x / r) * 6 * px + (right ? 4 : -4) * px
    const dy = (n.y / r) * 6 * px
    return (
      <text
        key={`l${i}`}
        x={n.x + dx}
        y={n.y + dy}
        textAnchor={i === 0 && r < 1 ? "middle" : right ? "start" : "end"}
        dominantBaseline="middle"
        className={`beta-ctree__label${strong ? " is-strong" : ""}`}
        style={{ fontSize: fs, strokeWidth: 3 * px }}
      >
        {n.label}
      </text>
    )
  }

  return (
    <div className="panel beta-ctree">
      <div className="panel-face">
        <div className="panel-bar beta-inst-bar">
          <b>The Computer Tree, 1945 to 2025</b>
          <span className="beta-inst-tags">
            <span className="tag beta-inst">{nodes.length} machines</span>
            <span className="tag beta-inst">{links.length} links</span>
          </span>
        </div>

        <div className="beta-ctree__controls">
          <label className="beta-ctree__find" htmlFor={`${ids}-q`}>
            <span>Find a machine</span>
            <input
              id={`${ids}-q`}
              list={`${ids}-list`}
              value={query}
              placeholder="Cray-1, iPhone, IBM 701"
              onChange={(e) => pick(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <datalist id={`${ids}-list`}>
            {nodes.map((n) => (
              <option key={n.id} value={n.label} />
            ))}
          </datalist>
          <div className="beta-ctree__toggles">
            <span className="beta-ctree__seg" role="group" aria-label="Zoom">
              {ZOOMS.map((z) => (
                <button key={z} type="button" aria-pressed={zoom === z} onClick={() => setZoom(z)}>
                  {z}×
                </button>
              ))}
            </span>
            <button
              type="button"
              className="beta-ctree__chip"
              aria-pressed={cross}
              onClick={() => setCross((c) => !c)}
            >
              Cross-links
            </button>
          </div>
        </div>

        <div className="beta-ctree__body">
          <div className="beta-ctree__box" ref={boxRef} data-zoom={zoom}>
            <svg
              ref={svgRef}
              viewBox={`${-span / 2} ${-span / 2} ${span} ${span}`}
              style={{ width: `${zoom * 100}%` }}
              role="img"
              aria-label={`A radial tree of ${nodes.length} computers from ENIAC in 1945 to 2025, one ring per period. Selected: ${s.label}.`}
              onPointerLeave={() => setHover(-1)}
            >
              <g className="beta-ctree__rings">
                {rings.map((r) => (
                  <g key={r.year}>
                    <circle r={r.r} />
                    <text y={-r.r + 4 * px} style={{ fontSize: (small ? 8 : 10) * px }} dominantBaseline="hanging">
                      {r.year === 2030 ? "2025" : r.year}
                    </text>
                  </g>
                ))}
              </g>

              <g className="beta-ctree__links">
                {links.map((l, k) =>
                  l.primary ? (
                    <path key={k} d={l.d} strokeDasharray={l.firm ? undefined : `${3 * px} ${2.5 * px}`} style={{ strokeWidth: 0.9 * px }} />
                  ) : null
                )}
              </g>
              {cross && (
                <g className="beta-ctree__cross">
                  {links.map((l, k) =>
                    l.primary ? null : (
                      <path key={k} d={l.d} strokeDasharray={l.firm ? undefined : `${3 * px} ${2.5 * px}`} style={{ strokeWidth: 0.9 * px }} />
                    )
                  )}
                </g>
              )}

              {/* The selection: every link into and out of it, then its line home. */}
              <g className="beta-ctree__near">
                {[...linksOf.into[sel], ...linksOf.out[sel]].map((k) => (
                  <path
                    key={k}
                    d={links[k].d}
                    strokeDasharray={links[k].firm ? undefined : `${3 * px} ${2.5 * px}`}
                    style={{ strokeWidth: 1.2 * px }}
                  />
                ))}
              </g>
              <g className="beta-ctree__line">
                {line.slice(0, -1).map((i) => {
                  const k = linksOf.into[i].find((k) => links[k].s === nodes[i].parent)!
                  return (
                    <path
                      key={k}
                      d={links[k].d}
                      strokeDasharray={links[k].firm ? undefined : `${4 * px} ${3 * px}`}
                      style={{ strokeWidth: 2.2 * px }}
                    />
                  )
                })}
              </g>

              <g className="beta-ctree__nodes">
                {nodes.map((n, i) => (
                  <circle
                    key={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={n.parent === -1 ? dot * 1.6 : dot}
                    className={`${n.chart ? "is-chart" : "is-ext"}${onLine.has(i) ? " is-line" : ""}`}
                    style={{ strokeWidth: 1.2 * px }}
                  />
                ))}
              </g>
              {/* Hit targets: bigger than the dots, invisible, on top. */}
              <g className="beta-ctree__hits">
                {nodes.map((n, i) => (
                  <circle
                    key={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={Math.max(dot * 2, 7 * px)}
                    onPointerEnter={() => setHover(i)}
                    onClick={() => {
                      setSel(i)
                      setQuery("")
                    }}
                  />
                ))}
              </g>
              <circle className="beta-ctree__sel" cx={s.x} cy={s.y} r={dot * 2.6} style={{ strokeWidth: 1.6 * px }} />

              <g className="beta-ctree__labels" aria-hidden="true">
                {!small &&
                  nodes.map((n, i) => (LANDMARKS.has(n.id) && i !== sel && i !== hover ? label(i, false) : null))}
                {hover !== -1 && hover !== sel && label(hover, false)}
                {label(sel, true)}
              </g>
            </svg>
          </div>

          <div className="beta-ctree__read" aria-live="polite">
            <p className="beta-ctree__name">{s.label}</p>
            <p className="beta-ctree__meta">
              {s.year ?? "undated"} · {s.maker === "?" ? "maker not on the chart" : s.maker}
            </p>
            <p className="beta-ctree__meta">
              <i className={`beta-ctree__key ${s.chart ? "is-chart" : "is-ext"}`} aria-hidden="true" />
              {s.chart ? "On the 1961 chart" : "Added since"} · {s.branch}
            </p>
            {s.notes && <p className="beta-ctree__notes">{s.notes}</p>}

            <p className="beta-ctree__h">
              {generations === 0
                ? "A root: nothing on the tree before it"
                : `${generations} generation${generations === 1 ? "" : "s"} back to ${nodes[line[line.length - 1]].label}`}
            </p>
            {generations > 0 && (
              <ol className="beta-ctree__lineage">
                {line.slice(1).map((i, j) => {
                  const k = linksOf.into[line[j]].find((k) => links[k].s === i)!
                  return (
                    <li key={i}>
                      <button type="button" onClick={() => setSel(i)}>
                        {nodes[i].label}
                      </button>
                      <span>
                        {nodes[i].year ?? "undated"}
                        {links[k].firm ? "" : ", link estimated"}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}

            {parents.length > 1 && (
              <>
                <p className="beta-ctree__h">Also descends from</p>
                <ul className="beta-ctree__list">
                  {parents
                    .filter((l) => !l.primary)
                    .map((l) => (
                      <li key={l.s}>
                        <button type="button" onClick={() => setSel(l.s)}>
                          {nodes[l.s].label}
                        </button>
                        <span>{REL[l.rel]}</span>
                      </li>
                    ))}
                </ul>
              </>
            )}

            {children.length > 0 && (
              <>
                <p className="beta-ctree__h">
                  {children.length} {children.length === 1 ? "child" : "children"}
                </p>
                <ul className="beta-ctree__list">
                  {children.map((l) => (
                    <li key={l.t}>
                      <button type="button" onClick={() => setSel(l.t)}>
                        {nodes[l.t].label}
                      </button>
                      <span>{nodes[l.t].year ?? "undated"}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <ul className="beta-ctree__legend">
          <li>
            <i className="beta-ctree__key is-chart" aria-hidden="true" />
            On the 1961 chart
          </li>
          <li>
            <i className="beta-ctree__key is-ext" aria-hidden="true" />
            Added, 1960 to 2025
          </li>
          <li>
            <i className="beta-ctree__dash" aria-hidden="true" />
            Link estimated
          </li>
          <li>
            <i className="beta-ctree__key is-line" aria-hidden="true" />
            Selected line
          </li>
          {cross && (
            <li>
              <i className="beta-ctree__dash is-cross" aria-hidden="true" />
              Cross-link (second parent)
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
