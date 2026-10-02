import {
  BIO_LOGO_BODY_PATH,
  BIO_LOGO_BOWL_PATH,
  BIO_LOGO_DOT,
  BIO_LOGO_GROUP_TRANSFORM,
  BIO_LOGO_VIEWBOX,
} from "@/lib/bio-logo-path"

/**
 * BioLogo: the official bio wordmark.
 *
 * Three independent SVG shapes (body / bowl / dot) so each can carry its own
 * color. Defaults: every piece rides on `currentColor`. Set color via CSS or
 * the `style` prop. Pass `bodyColor` / `bowlColor` / `dotColor` to tint
 * individual pieces (the style guide uses a lighter dot for visual depth).
 *
 * Source asset: `docs/bio-logo-v2.svg`. Path geometry lives in
 * `lib/bio-logo-path.ts`.
 */
export interface BioLogoProps extends Omit<React.SVGProps<SVGSVGElement>, "color"> {
  /** Rendered height (px). Width auto-scales via the viewBox. Default: `1em`. */
  height?: number
  /** Alt text. Pass empty string to mark decorative. */
  title?: string
  /** Color for the main wordmark mass. Default: `currentColor`. */
  bodyColor?: string
  /** Color for the inner "b" swoop. Default: matches `bodyColor` (or `currentColor`). */
  bowlColor?: string
  /** Color for the i-dot. Default: matches `bodyColor` (or `currentColor`). */
  dotColor?: string
  /**
   * Let the dot of the "i" lift when the link around the mark is hovered or
   * focused. This only marks the SVG (`data-bob`) and tells the stylesheet how
   * far two screen pixels is in this drawing's own units; the motion itself is
   * the `.beta-nav-mark` rule in app/kit.css, and the parent link has to carry
   * that class for anything to move.
   */
  bobOnHover?: boolean
}

export function BioLogo({
  height,
  title = "bio",
  style,
  bodyColor = "currentColor",
  bowlColor,
  dotColor,
  bobOnHover = false,
  ...rest
}: BioLogoProps) {
  const finalBowl = bowlColor ?? bodyColor
  const finalDot = dotColor ?? bodyColor

  // The v2 dot sits at viewBox y≈1.5, which is basically touching the top edge,
  // so sub-pixel rendering clips it. Add ~10 units of breathing room at top.
  const PADDED_VIEWBOX = "0 -10 557.60217 302.12289"
  void BIO_LOGO_VIEWBOX // exported for downstream consumers; intentionally not used here

  // The lift is two pixels on screen. A CSS transform on a shape inside an SVG
  // is measured in the drawing's user units, not screen pixels, and this
  // drawing is 302 units tall however small it is rendered: at the masthead's
  // 18px, "2px" would move the dot a ninth of a pixel. So the distance is
  // converted here, where the rendered height is known. With no numeric height
  // (the 1em default) the stylesheet's fallback applies.
  const PADDED_HEIGHT = 302.12289
  const BOB_PX = 2
  const bobUnits =
    bobOnHover && typeof height === "number" && height > 0
      ? Math.round(((BOB_PX * PADDED_HEIGHT) / height) * 10) / 10
      : undefined

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={PADDED_VIEWBOX}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      data-bob={bobOnHover ? "true" : undefined}
      overflow="visible"
      style={{
        height: height ?? "1em",
        width: "auto",
        display: "inline-block",
        verticalAlign: "middle",
        overflow: "visible",
        ...(bobUnits !== undefined ? ({ "--beta-nav-lift": bobUnits } as React.CSSProperties) : null),
        ...style,
      }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <g transform={BIO_LOGO_GROUP_TRANSFORM}>
        <path d={BIO_LOGO_BODY_PATH} fill={bodyColor} data-piece="body" />
        <path d={BIO_LOGO_BOWL_PATH} fill={finalBowl} data-piece="bowl" />
        <circle
          cx={BIO_LOGO_DOT.cx}
          cy={BIO_LOGO_DOT.cy}
          r={BIO_LOGO_DOT.r}
          fill={finalDot}
          data-piece="dot"
        />
      </g>
    </svg>
  )
}
