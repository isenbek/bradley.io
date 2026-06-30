// Pluggable decoder registry for the WorldEvent bus.
// Known event types get a rich renderer; everything else falls back to
// GenericSample. Add a new sense's decoder here and it lights up — the bus
// itself stays type-agnostic.
import type { ComponentType } from "react"
import { ChronyTracking } from "./ChronyTracking"
import { MeshRssiMap } from "./MeshRssiMap"

type Sample = Record<string, unknown>

export type Decoder = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Comp: ComponentType<{ data: any }>
  wide?: boolean // span the full card row (for graphs / maps)
}

const REGISTRY: Record<string, Decoder> = {
  "chrony.tracking": { Comp: ChronyTracking },
  "mesh.rssi_map": { Comp: MeshRssiMap, wide: true },
}

export function decoderFor(type: string): Decoder | null {
  return REGISTRY[type] ?? null
}

// Generic fallback: compact key/value list, nested values summarized.
export function GenericSample({ sample }: { sample: Sample }) {
  const entries = Object.entries(sample).slice(0, 6)
  return (
    <dl className="v3-we-card__sample">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{render(v)}</dd>
        </div>
      ))}
    </dl>
  )
}

function render(v: unknown): string {
  if (Array.isArray(v)) return `[${v.length} items]`
  if (v && typeof v === "object") return "{…}"
  const s = String(v)
  return s.length > 48 ? s.slice(0, 45) + "…" : s
}
