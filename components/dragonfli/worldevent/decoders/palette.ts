/**
 * Colour for the worldevent decoders, by the job the colour is doing.
 *
 * Every decoder used to build its own `hsl()` string, and they all made the same
 * two mistakes. Signal strength was drawn as a red-to-green rainbow sweep: a
 * rainbow is not a magnitude scale (hue has no natural order, and the eye reads
 * the yellow band as a peak rather than a midpoint), and its low end is RED,
 * which in this palette means an assertion failed. A distant but perfectly
 * healthy node was rendering as a broken one.
 *
 * So the rules the kit already sets, applied once here instead of six times:
 * magnitude gets ONE hue light to dark, identity gets the categorical order
 * assigned and never cycled, and red stays reserved.
 */

/** Magnitude (signal strength, SNR, RSSI): one hue, mixed toward the panel
 *  ground so a weak signal recedes into the well rather than shouting. */
export function rampColor(s: number): string {
  const t = Math.max(0, Math.min(1, s))
  return `color-mix(in oklab, var(--color-ocean) ${Math.round(15 + t * 85)}%, var(--color-panel))`
}

/** Identity (cluster, schema): the Earth Conductor order, in order. A series
 *  past the fourth is deliberately neutral rather than a generated fifth hue;
 *  these views all label their entities, so colour is a tag beside a name. */
export const CATEGORICAL = ["ocean", "burnt", "mustard", "forest"] as const

export function categoricalColor(i: number): string {
  return i >= 0 && i < CATEGORICAL.length
    ? `var(--color-${CATEGORICAL[i]})`
    : "var(--color-glass-muted)"
}
