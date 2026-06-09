/**
 * V3Logo — the "bio·bradley.io" wordmark used in nav/footer/share cards.
 * Pure presentational. Color and size scale via CSS classes the caller controls.
 *
 * NOTE: Final SVG logo from the style guide is pending — when it lands, swap
 * the inline markup here for the SVG and keep the same prop surface.
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
    nav: { mark: "1.5rem", tag: "0.8125rem", gap: "2px" },
    footer: { mark: "2.5rem", tag: "1rem", gap: "4px" },
    hero: { mark: "5.25rem", tag: "1.3125rem", gap: "6px" },
  } as const

  const { mark, tag, gap } = sizeMap[size]

  return (
    <span
      className="v3-font-logo"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: 1,
        gap,
      }}
      aria-label="bio·bradley.io"
    >
      <span style={{ fontWeight: 800, fontSize: mark, color: colorMap[variant], letterSpacing: "-0.04em" }}>
        bi<span style={{ color: "var(--v3-blue-300)" }}>o</span>
      </span>
      <span
        className="v3-font-body"
        style={{
          fontWeight: 600,
          fontSize: tag,
          letterSpacing: "0.16em",
          color: "var(--v3-charcoal)",
        }}
      >
        bradley<span style={{ color: colorMap[variant] }}>.io</span>
      </span>
    </span>
  )
}
