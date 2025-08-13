import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Star, 
  GitFork, 
  Code, 
  ExternalLink, 
  Calendar,
  Activity,
  GitBranch,
  Database
} from "lucide-react"
import { 
  fetchGitHubRepos, 
  fetchUserRepos,
  calculateGitHubStats, 
  getLanguageColor, 
  formatRepoSize,
  getTimeAgo,
  type GitHubRepo 
} from "@/lib/github"

interface GitHubReposProps {
  source?: "org" | "user"
  username?: string
  limit?: number
  showStats?: boolean
}

export function GitHubRepos({ 
  source = "org", 
  username = "isenbek",
  limit = 6,
  showStats = true 
}: GitHubReposProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRepos() {
      try {
        setLoading(true)
        let fetchedRepos = source === "org" 
          ? await fetchGitHubRepos()
          : await fetchUserRepos(username)
        
        // Filter out archived and disabled repos
        fetchedRepos = fetchedRepos.filter(repo => !repo.archived && !repo.disabled)
        
        setRepos(fetchedRepos)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repos")
      } finally {
        setLoading(false)
      }
    }

    loadRepos()
  }, [source, username])

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const stats = calculateGitHubStats(repos)
  const displayRepos = repos.slice(0, limit)

  return (
    <div className="space-y-8">
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalRepos}</p>
                  <p className="text-xs text-muted-foreground">Repositories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalStars}</p>
                  <p className="text-xs text-muted-foreground">Stars</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalForks}</p>
                  <p className="text-xs text-muted-foreground">Forks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-bold">
                    {stats.recentActivity 
                      ? getTimeAgo(stats.recentActivity.toISOString())
                      : "No activity"}
                  </p>
                  <p className="text-xs text-muted-foreground">Last Push</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayRepos.map((repo) => (
          <Card key={repo.id} className="group hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    {repo.name}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {repo.description || "No description available"}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <a 
                    href={repo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={`View ${repo.name} on GitHub`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Language and Size */}
                <div className="flex items-center gap-3 text-sm">
                  {repo.language && (
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                      />
                      <span>{repo.language}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Database className="h-3 w-3" />
                    <span>{formatRepoSize(repo.size)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {repo.stargazers_count > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                  )}
                  {repo.forks_count > 0 && (
                    <div className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      <span>{repo.forks_count}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{getTimeAgo(repo.pushed_at)}</span>
                  </div>
                </div>

                {/* Topics */}
                {repo.topics && repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {repo.topics.slice(0, 3).map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {repos.length > limit && (
        <div className="text-center">
          <Button asChild variant="outline">
            <a 
              href={source === "org" 
                ? "https://github.com/orgs/tinymachines/repositories"
                : `https://github.com/${username}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              View All {repos.length} Repositories on GitHub
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}