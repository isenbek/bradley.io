export interface TimelinePhase {
  name: string
  startDate: string
  endDate: string
  description: string
  repos: string[]
  milestones: TimelineMilestone[]
  category: string
}

export interface TimelineMilestone {
  date: string
  title: string
  repo: string
}

export interface TimelineRepo {
  name: string
  description: string
  language: string
  commits: number
  firstCommit: string
  lastCommit: string
  phase: string
}

export interface NominateTimeline {
  generated: string
  org: string
  totalRepos: number
  firstCommit: string
  latestCommit: string
  totalCommits: number
  languages: Record<string, number>
  phases: TimelinePhase[]
  repos: TimelineRepo[]
}
