import {
  BIO_LOGO_BODY_PATH,
  BIO_LOGO_BOWL_PATH,
  BIO_LOGO_DOT,
  BIO_LOGO_GROUP_TRANSFORM,
  BIO_LOGO_VIEWBOX,
} from "@/lib/bio-logo-path"

/**
 * BioLogo — the official bio wordmark.
 *
 * Three independent SVG shapes (body / bowl / dot) so each can carry its own
 * color. Defaults: every piece rides on `currentColor` — set color via CSS or
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
  /** Toggle the playful hover bob on the dot (only inside a `.v3-biologo--bob` parent on the page). */
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

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={BIO_LOGO_VIEWBOX}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      data-bob={bobOnHover ? "true" : undefined}
      style={{
        height: height ?? "1em",
        width: "auto",
        display: "inline-block",
        verticalAlign: "middle",
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
