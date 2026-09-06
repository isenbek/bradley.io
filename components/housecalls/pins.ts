import { SEQUENTIAL_HEX } from "@/lib/beta/chart-theme"

/**
 * The P2 pin contract (docs/housecalls/p2-pin-schema.md).
 *
 * Stages are an ordered progression, so they ride the one-hue sequential ramp
 * (five steps for five stages) with radius as the secondary encoding; never
 * categorical hues, never color alone. won/closed never reach the file.
 */

export const PIN_STAGES = ["identified", "qualified", "drafted", "contacted", "replied"] as const
export type PinStage = (typeof PIN_STAGES)[number]

export interface Pin {
  id: string
  stage: PinStage
  /** Centroid-snapped [lon, lat]; never an address (schema position rules). */
  pos: [number, number]
  county: string
  label: string | null
  sector: string | null
  since: string
  fact: string | null
}

export interface PinFile {
  generated: string
  stages: PinStage[]
  pins: Pin[]
}

export const STAGE_COLOR: Record<PinStage, string> = {
  identified: SEQUENTIAL_HEX[0],
  qualified: SEQUENTIAL_HEX[1],
  drafted: SEQUENTIAL_HEX[2],
  contacted: SEQUENTIAL_HEX[3],
  replied: SEQUENTIAL_HEX[4],
}

export const STAGE_RADIUS: Record<PinStage, number> = {
  identified: 3,
  qualified: 4,
  drafted: 5,
  contacted: 6,
  replied: 7,
}
