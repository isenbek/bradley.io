/**
 * Chart colour for /beta. One source, so a chart cannot quietly invent a hue.
 *
 * Charts render on PANEL, never on paper. STYLE.md §1: a dark box on a
 * tinymachines page means the value inside it came out of the engine, and a
 * chart is the most literal case of that there is.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE ARE ONLY TWO CATEGORICAL COLOURS
 *
 * The obvious move is to use the four Earth Conductor hues as a four-series
 * categorical set. Measured against the panel ground, they do not work that way,
 * and the numbers are not close:
 *
 *   ocean  #5FB8C0 <-> forest #5FA772   normal-vision dE 10.8   (floor is 15)
 *   burnt  #D06B40 <-> forest #5FA772   deutan        dE  6.1   (floor is  8)
 *
 * Below the normal-vision floor means a reader with full colour vision cannot
 * reliably tell the two series apart, so reordering does not help: it fixes the
 * adjacent-pair case and leaves any chart that compares every pair at once,
 * which is every stacked bar and every share-of-total, exactly as broken.
 *
 * That is not a defect in the palette. tokens.css says the Earth Conductor
 * "assigns identity to a region, a bus, a signal class" - things that carry a
 * name, where colour is a tag beside a label rather than the encoding itself.
 * It was never a four-series chart ramp.
 *
 * So:
 *   - Two series that must be told apart by colour: SERIES, below. ocean and
 *     burnt measure at normal dE 24.2 and deutan dE 16.3, clear of both floors.
 *   - Three or four: still allowed, in the fixed order below, but never by
 *     colour alone. Legend AND direct labels, both.
 *   - Magnitude, which is most of what this site plots: not categorical at all.
 *     Use SEQUENTIAL.
 *
 * Re-check with the dataviz skill's validator after any change here:
 *   node scripts/validate_palette.js "#5FB8C0,#D06B40" --mode dark \
 *     --surface "#131311" --pairs all
 * ---------------------------------------------------------------------------
 */

/** The panel ground every beta chart draws on. */
export const CHART_SURFACE = "var(--color-panel)"

/**
 * Categorical series, in fixed order. Never cycled: a fifth series folds into
 * "Other" or becomes small multiples. Colour follows the entity and never its
 * rank, so a filter that drops a series must not repaint the survivors.
 */
export const SERIES = [
  { token: "var(--color-ocean)", hex: "#5FB8C0", name: "ocean" },
  { token: "var(--color-burnt)", hex: "#D06B40", name: "burnt" },
  // Third and fourth are legal only with a legend AND direct labels. See above.
  { token: "var(--color-mustard)", hex: "#D2B771", name: "mustard" },
  { token: "var(--color-forest)", hex: "#5FA772", name: "forest" },
] as const

/**
 * Sequential ramp for magnitude: commit density, language share, coverage.
 *
 * One hue, light to dark, which is the rule for magnitude. Every step is
 * `color-mix()` from --color-ocean toward --color-panel, so the ramp is derived
 * from tokens rather than being five new colours: change the token and the ramp
 * follows. Lightness is monotonic across the five steps (OKLab L 0.295, 0.404,
 * 0.513, 0.622, 0.731), which is what makes it readable as an ordered scale.
 */
export const SEQUENTIAL = [
  "color-mix(in oklab, var(--color-ocean) 20%, var(--color-panel))",
  "color-mix(in oklab, var(--color-ocean) 40%, var(--color-panel))",
  "color-mix(in oklab, var(--color-ocean) 60%, var(--color-panel))",
  "color-mix(in oklab, var(--color-ocean) 80%, var(--color-panel))",
  "var(--color-ocean)",
] as const

/** The zero/empty cell in a heatmap. A step below the ramp's own floor. */
export const SEQUENTIAL_EMPTY = "var(--color-panel-raised)"

/**
 * Chart furniture. Recessive by rule: the grid is not data and must not compete
 * with it.
 */
export const CHART_INK = {
  /** Axis lines, gridlines, hairlines. */
  grid: "var(--color-rule-panel)",
  /** Tick labels, axis titles, legend text. */
  label: "var(--color-glass-muted)",
  /** Values and anything that has to be read exactly. */
  value: "var(--color-glass)",
} as const

/**
 * State colours. Reserved, and never available as "series 5".
 *
 * STYLE.md §8 rule 4: red means an assertion failed and nothing else is red.
 * Blue is ACTIVE, orange is ATTENTION. Each ships with a label or an icon, never
 * as colour alone.
 */
export const STATE = {
  active: "var(--color-blue)",
  attention: "var(--color-orange)",
  failed: "var(--color-red)",
} as const

/** Pick a sequential step for a 0..1 magnitude. */
export function rampStep(t: number): string {
  if (!(t > 0)) return SEQUENTIAL_EMPTY
  const i = Math.min(SEQUENTIAL.length - 1, Math.floor(t * SEQUENTIAL.length))
  return SEQUENTIAL[i]
}

/**
 * ---------------------------------------------------------------------------
 * THE MAP PALETTE, AS LITERAL HEX
 *
 * MapLibre paint properties are evaluated by the GL renderer, not by CSS, so a
 * `var(--color-ocean)` in a paint spec resolves to nothing and the layer draws
 * black. The map layers therefore need real hex, which means these values are a
 * SECOND copy of the tokens and can drift from them.
 *
 * They are written down here, once, rather than inline at each of the ~25 paint
 * sites, and every value is either a token verbatim or an OKLab step between two
 * tokens. Regenerate SEQUENTIAL_HEX after any change to --color-ocean or
 * --color-panel; the steps are the same mix percentages as SEQUENTIAL above, so
 * the maps and the charts show the same ramp.
 * ---------------------------------------------------------------------------
 */

/** SEQUENTIAL, resolved. OKLab L 0.295 / 0.404 / 0.513 / 0.622 / 0.731: an
 *  ordered scale, because lightness rises monotonically across the five. */
export const SEQUENTIAL_HEX = ["#232F2F", "#324F50", "#417073", "#509399", "#5FB8C0"] as const

/** Tokens the map layers need as hex. Keep in sync with app/beta/kit/tokens.css. */
export const MAP_INK = {
  ocean: "#5FB8C0",
  oceanDeep: "#1A5A61",
  burnt: "#D06B40",
  burntDeep: "#8E3D1C",
  mustard: "#D2B771",
  forest: "#5FA772",
  glass: "#E9E6DE",
  glassMuted: "#8C8A85",
  panel: "#131311",
  panelSunk: "#0B0B0A",
  rulePanel: "#34322C",
  float: "#4A4842",
} as const

/**
 * Magnitude on a map (altitude, contact density, signal strength).
 *
 * Returns a MapLibre `interpolate` colour ramp across SEQUENTIAL_HEX for the
 * given data breakpoints. Both callers used to hand-roll a rainbow here:
 * altitude ran amber to cyan to violet to pink, and density ran navy to indigo
 * to violet to RED to amber. Hue has no natural order, so neither read as a
 * scale, and the density ramp put the palette's reserved failure colour in the
 * middle of a perfectly ordinary aircraft count.
 */
export function mapRamp(stops: readonly number[]): (string | number)[] {
  const n = Math.min(stops.length, SEQUENTIAL_HEX.length)
  const out: (string | number)[] = []
  for (let i = 0; i < n; i++) out.push(stops[i], SEQUENTIAL_HEX[i])
  return out
}
