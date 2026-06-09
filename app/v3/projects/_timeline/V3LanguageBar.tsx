import { langColor } from "./lang-colors"

export function V3LanguageBar({ languages }: { languages: Record<string, number> }) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1

  return (
    <div>
      <div className="v3-langbar">
        {entries.map(([name, repos]) => {
          const pct = (repos / total) * 100
          return (
            <div
              key={name}
              className="v3-langbar__seg"
              title={`${name} · ${repos} repos · ${pct.toFixed(1)}%`}
              style={{
                width: `${pct}%`,
                background: langColor(name),
              }}
              aria-label={`${name}: ${pct.toFixed(1)}%`}
            />
          )
        })}
      </div>
      <div className="v3-langbar__legend">
        {entries.slice(0, 10).map(([name, repos]) => {
          const pct = (repos / total) * 100
          return (
            <span key={name} className="v3-langbar__legend-row">
              <span className="v3-langbar__sw" style={{ background: langColor(name) }} />
              {name} <span className="v3-langbar__pct">{pct.toFixed(0)}%</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
