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

export interface CommitDay {
  date: string
  commits: number
  repos: number
  intensity: 0 | 1 | 2 | 3 | 4
}

export interface NominateTimeline {
  generated: string
  org: string
  totalRepos: number
  firstCommit: string
  latestCommit: string
  totalCommits: number
  languages: Record<string, number>
  activityHeatmap: CommitDay[]
  phases: TimelinePhase[]
  repos: TimelineRepo[]
}
