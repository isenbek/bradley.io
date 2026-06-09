import { BioLogo } from "./BioLogo"

/**
 * V3Logo — the stacked "bio / bradley.io" wordmark used on share cards and
 * hero contexts. Wraps the SVG `<BioLogo />` with the "bradley.io" subtag
 * underneath so all three sizes share the same proportions.
 */
export function V3Logo({
  size = "nav",
  variant = "blue",
}: {
  size?: "nav" | "footer" | "hero"
  variant?: "blue" | "coral" | "gold" | "green"
}) {
  const colorMap = {
    blue: "var(--v3-blue-500)",
    coral: "var(--v3-coral)",
    gold: "var(--v3-gold)",
    green: "var(--v3-green)",
  } as const

  const sizeMap = {
    nav: { mark: 28, tag: "0.8125rem", gap: 4 },
    footer: { mark: 56, tag: "1rem", gap: 6 },
    hero: { mark: 110, tag: "1.3125rem", gap: 10 },
  } as const

  const { mark, tag, gap } = sizeMap[size]

  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: 1,
        gap,
      }}
      aria-label="bio·bradley.io"
    >
      <BioLogo height={mark} title="" style={{ color: colorMap[variant] }} />
      <span
        className="v3-font-body"
        style={{
          fontWeight: 700,
          fontSize: tag,
          letterSpacing: "0.16em",
          color: "var(--v3-charcoal)",
          textTransform: "lowercase",
        }}
      >
        bradley<span style={{ color: colorMap[variant] }}>.io</span>
      </span>
    </span>
  )
}
