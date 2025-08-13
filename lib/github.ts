export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  topics: string[]
  visibility: string
  archived: boolean
  disabled: boolean
}

export interface GitHubStats {
  totalRepos: number
  totalStars: number
  totalForks: number
  languages: { [key: string]: number }
  recentActivity: Date | null
}

const GITHUB_API_BASE = "https://api.github.com"
const ORG_NAME = "tinymachines"

// Cache repos for 1 hour
let repoCache: { data: GitHubRepo[]; timestamp: number } | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  // Check cache
  if (repoCache && Date.now() - repoCache.timestamp < CACHE_DURATION) {
    return repoCache.data
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/orgs/${ORG_NAME}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Add token if you have one for higher rate limits
          // Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
        next: { revalidate: 3600 }, // Next.js cache for 1 hour
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repos = await response.json()
    
    // Update cache
    repoCache = {
      data: repos,
      timestamp: Date.now(),
    }

    return repos
  } catch (error) {
    console.error("Failed to fetch GitHub repos:", error)
    return []
  }
}

export async function fetchUserRepos(username: string = "isenbek"): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch user repos:", error)
    return []
  }
}

export function calculateGitHubStats(repos: GitHubRepo[]): GitHubStats {
  const stats: GitHubStats = {
    totalRepos: repos.length,
    totalStars: 0,
    totalForks: 0,
    languages: {},
    recentActivity: null,
  }

  let mostRecentPush: Date | null = null

  repos.forEach((repo) => {
    // Count stars and forks
    stats.totalStars += repo.stargazers_count
    stats.totalForks += repo.forks_count

    // Count languages
    if (repo.language) {
      stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1
    }

    // Track most recent activity
    const pushDate = new Date(repo.pushed_at)
    if (!mostRecentPush || pushDate > mostRecentPush) {
      mostRecentPush = pushDate
    }
  })

  stats.recentActivity = mostRecentPush

  return stats
}

export function getLanguageColor(language: string): string {
  const colors: { [key: string]: string } = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    "C++": "#f34b7d",
    C: "#555555",
    Go: "#00ADD8",
    Rust: "#dea584",
    Java: "#b07219",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#ffac45",
    Kotlin: "#F18E33",
    Scala: "#c22d40",
    R: "#198CE7",
  }

  return colors[language] || "#858585"
}

export function formatRepoSize(size: number): string {
  if (size < 1024) return `${size} KB`
  return `${(size / 1024).toFixed(1)} MB`
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`
    }
  }

  return "just now"
}