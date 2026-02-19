export function ForgeIcon({ size = 48 }: { size?: number }) {
  return (
    <div
      className="flex gap-[3px] items-end"
      style={{ transform: "rotate(-5deg)" }}
    >
      <div
        className="rounded"
        style={{
          width: size * 0.35,
          height: size * 0.6,
          background: "var(--brand-steel)",
          opacity: 0.7,
        }}
      />
      <div
        className="rounded"
        style={{
          width: size * 0.35,
          height: size * 0.8,
          background: "var(--brand-primary)",
          marginBottom: size * 0.1,
        }}
      />
      <div
        className="rounded"
        style={{
          width: size * 0.35,
          height: size * 0.5,
          background: "var(--brand-secondary)",
          opacity: 0.8,
        }}
      />
    </div>
  )
}
