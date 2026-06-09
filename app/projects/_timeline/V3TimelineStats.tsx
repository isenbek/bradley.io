interface Props {
  totalRepos: number
  totalCommits: number
  firstCommit: string
  latestCommit: string
  languageCount: number
}

function compact(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
}

function span(firstISO: string, latestISO: string): string {
  const first = new Date(firstISO).getTime()
  const last = new Date(latestISO).getTime()
  const days = (last - first) / 86_400_000
  if (days < 60) return `${Math.round(days)}d`
  if (days < 730) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}yr`
}

export function V3TimelineStats({
  totalRepos,
  totalCommits,
  firstCommit,
  latestCommit,
  languageCount,
}: Props) {
  return (
    <div className="v3-tlmeta">
      <div className="v3-tlmeta__cell">
        <div className="v3-tlmeta__val">{totalRepos}</div>
        <div className="v3-tlmeta__lbl">Repos</div>
      </div>
      <div className="v3-tlmeta__cell">
        <div className="v3-tlmeta__val">{compact(totalCommits)}</div>
        <div className="v3-tlmeta__lbl">Commits</div>
      </div>
      <div className="v3-tlmeta__cell">
        <div className="v3-tlmeta__val">{languageCount}</div>
        <div className="v3-tlmeta__lbl">Languages</div>
      </div>
      <div className="v3-tlmeta__cell">
        <div className="v3-tlmeta__val">{span(firstCommit, latestCommit)}</div>
        <div className="v3-tlmeta__lbl">Span</div>
      </div>
    </div>
  )
}
