// Client-side projects parser - fetches data from API

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  language: string | null;
  topics: string[];
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  readme?: {
    summary: string;
    fullContent: string;
    size: number;
  } | null;
  language_stats?: {
    total_bytes: number;
    languages: {
      [key: string]: {
        bytes: number;
        percentage: number;
      };
    };
    primary_language: string | null;
  } | null;
  commit_stats?: {
    total_commits: number;
    recent_commits: number;
    last_commit: {
      sha: string;
      message: string;
      author: string;
      date: string;
    } | null;
    commit_frequency: number;
  } | null;
  release_info?: {
    total_releases: number;
    latest_release: {
      tag_name: string;
      name: string;
      published_at: string;
      body: string | null;
    };
    releases: Array<{
      tag_name: string;
      name: string;
      published_at: string;
      download_count: number;
    }>;
  } | null;
  last_synced: string;
  sync_version: string;
}

export interface GitHubSummary {
  last_updated: string;
  org_stats: {
    total_repos: number;
    total_stars: number;
    total_forks: number;
    languages: string[];
    most_popular: GitHubRepo | null;
  };
  user_stats: {
    total_repos: number;
    total_stars: number;
    total_forks: number;
    languages: string[];
    most_popular: GitHubRepo | null;
  };
}

export interface ProjectMetrics {
  codeQuality: number;
  activity: number;
  popularity: number;
  maintenance: number;
  overall: number;
}

export class ProjectsParser {
  private orgRepos: GitHubRepo[] = [];
  private userRepos: GitHubRepo[] = [];
  private summary: GitHubSummary | null = null;
  private dataLoaded = false;

  constructor() {
    // Data will be loaded via API call
  }

  async loadData() {
    if (this.dataLoaded) return;
    
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects data');
      }
      
      const data = await response.json();
      this.orgRepos = data.orgRepos || [];
      this.userRepos = data.userRepos || [];
      this.summary = data.summary || null;
      this.dataLoaded = true;
    } catch (error) {
      console.error('Error loading projects data:', error);
      this.orgRepos = [];
      this.userRepos = [];
      this.summary = null;
    }
  }

  // Get all repositories
  getAllRepos(): GitHubRepo[] {
    return [...this.orgRepos, ...this.userRepos];
  }

  // Get organization repositories
  getOrgRepos(): GitHubRepo[] {
    return this.orgRepos;
  }

  // Get user repositories
  getUserRepos(): GitHubRepo[] {
    return this.userRepos;
  }

  // Get repository by name
  getRepoByName(name: string): GitHubRepo | undefined {
    return this.getAllRepos().find(repo => repo.name === name);
  }

  // Get repository by full name (owner/repo)
  getRepoByFullName(fullName: string): GitHubRepo | undefined {
    return this.getAllRepos().find(repo => repo.full_name === fullName);
  }

  // Get summary statistics
  getSummary(): GitHubSummary | null {
    return this.summary;
  }

  // Get featured projects (top repos by various criteria)
  getFeaturedProjects(limit: number = 6): GitHubRepo[] {
    const repos = this.getAllRepos();
    
    // Sort by a combination of stars, forks, and recent activity
    return repos
      .filter(repo => !repo.fork && repo.description) // Exclude forks and repos without descriptions
      .sort((a, b) => {
        const scoreA = this.calculateProjectScore(a);
        const scoreB = this.calculateProjectScore(b);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Calculate a project score based on multiple factors
  private calculateProjectScore(repo: GitHubRepo): number {
    let score = 0;
    
    // Stars weight
    score += repo.stargazers_count * 10;
    
    // Forks weight  
    score += repo.forks_count * 5;
    
    // Recent activity (commits in last week)
    if (repo.commit_stats?.commit_frequency) {
      score += repo.commit_stats.commit_frequency * 20;
    }
    
    // Has README
    if (repo.readme) {
      score += 50;
    }
    
    // Has releases
    if (repo.release_info?.total_releases) {
      score += repo.release_info.total_releases * 10;
    }
    
    // Language diversity
    if (repo.language_stats?.languages) {
      score += Object.keys(repo.language_stats.languages).length * 5;
    }
    
    // Topics/tags
    score += repo.topics.length * 5;
    
    // License
    if (repo.license) {
      score += 25;
    }
    
    return score;
  }

  // Get projects by technology/language
  getProjectsByTechnology(technology: string): GitHubRepo[] {
    const tech = technology.toLowerCase();
    return this.getAllRepos().filter(repo => {
      return (
        repo.language?.toLowerCase() === tech ||
        repo.topics.some(topic => topic.toLowerCase().includes(tech)) ||
        (repo.language_stats?.languages && Object.keys(repo.language_stats.languages).some(lang => lang.toLowerCase() === tech))
      );
    });
  }

  // Get projects by topic
  getProjectsByTopic(topic: string): GitHubRepo[] {
    return this.getAllRepos().filter(repo => 
      repo.topics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
    );
  }

  // Search projects
  searchProjects(query: string): GitHubRepo[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllRepos().filter(repo => 
      repo.name.toLowerCase().includes(lowerQuery) ||
      repo.description?.toLowerCase().includes(lowerQuery) ||
      repo.topics.some(topic => topic.toLowerCase().includes(lowerQuery)) ||
      repo.readme?.summary?.toLowerCase().includes(lowerQuery)
    );
  }

  // Get all unique technologies used
  getAllTechnologies(): string[] {
    const technologies = new Set<string>();
    
    this.getAllRepos().forEach(repo => {
      if (repo.language) {
        technologies.add(repo.language);
      }
      
      if (repo.language_stats?.languages) {
        Object.keys(repo.language_stats.languages).forEach(lang => {
          technologies.add(lang);
        });
      }
      
      repo.topics.forEach(topic => {
        technologies.add(topic);
      });
    });
    
    return Array.from(technologies).sort();
  }

  // Get project metrics for analysis
  getProjectMetrics(repo: GitHubRepo): ProjectMetrics {
    const metrics = {
      codeQuality: this.calculateCodeQuality(repo),
      activity: this.calculateActivity(repo),
      popularity: this.calculatePopularity(repo),
      maintenance: this.calculateMaintenance(repo),
      overall: 0
    };

    // Calculate overall score as weighted average
    metrics.overall = Math.round(
      (metrics.codeQuality * 0.25 + 
       metrics.activity * 0.25 + 
       metrics.popularity * 0.25 + 
       metrics.maintenance * 0.25)
    );

    return metrics;
  }

  private calculateCodeQuality(repo: GitHubRepo): number {
    let score = 0;
    
    // Has README
    if (repo.readme) score += 25;
    
    // Has license
    if (repo.license) score += 25;
    
    // Has topics/tags
    score += Math.min(repo.topics.length * 5, 25);
    
    // Language diversity
    if (repo.language_stats?.languages) {
      const langCount = Object.keys(repo.language_stats.languages).length;
      score += Math.min(langCount * 5, 25);
    }
    
    return Math.min(score, 100);
  }

  private calculateActivity(repo: GitHubRepo): number {
    if (!repo.commit_stats) return 0;
    
    const weeklyCommits = repo.commit_stats.commit_frequency;
    const recentCommits = repo.commit_stats.recent_commits;
    
    // Score based on commit frequency
    let score = Math.min(weeklyCommits * 10, 50);
    score += Math.min(recentCommits * 2, 50);
    
    return Math.min(score, 100);
  }

  private calculatePopularity(repo: GitHubRepo): number {
    let score = 0;
    
    // Stars (up to 50 points)
    score += Math.min(repo.stargazers_count * 2, 50);
    
    // Forks (up to 25 points)
    score += Math.min(repo.forks_count * 5, 25);
    
    // Watchers (up to 25 points)
    score += Math.min(repo.watchers_count * 3, 25);
    
    return Math.min(score, 100);
  }

  private calculateMaintenance(repo: GitHubRepo): number {
    let score = 0;
    
    // Recent push (within last month)
    const lastPush = new Date(repo.pushed_at);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (lastPush > monthAgo) score += 50;
    
    // Has releases
    if (repo.release_info?.total_releases) {
      score += Math.min(repo.release_info.total_releases * 5, 25);
    }
    
    // Low open issues relative to project size
    const issueRatio = repo.open_issues_count / Math.max(repo.stargazers_count, 1);
    if (issueRatio < 0.1) score += 25;
    
    return Math.min(score, 100);
  }

  // Get trending projects (recently active with good engagement)
  getTrendingProjects(limit: number = 6): GitHubRepo[] {
    return this.getAllRepos()
      .filter(repo => !repo.fork)
      .sort((a, b) => {
        const scoreA = this.calculateTrendingScore(a);
        const scoreB = this.calculateTrendingScore(b);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  private calculateTrendingScore(repo: GitHubRepo): number {
    let score = 0;
    
    // Recent activity weight higher
    if (repo.commit_stats?.commit_frequency) {
      score += repo.commit_stats.commit_frequency * 50;
    }
    
    // Recent push
    const daysSinceUpdate = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate < 7) score += 100;
    else if (daysSinceUpdate < 30) score += 50;
    
    // Stars and forks (but weighted less for trending)
    score += repo.stargazers_count * 2;
    score += repo.forks_count * 3;
    
    return score;
  }

  // Export data for dashboard usage
  exportDashboardData() {
    return {
      summary: this.summary,
      featured: this.getFeaturedProjects(8),
      trending: this.getTrendingProjects(6),
      technologies: this.getAllTechnologies(),
      totalRepos: this.getAllRepos().length,
      lastUpdated: this.summary?.last_updated || new Date().toISOString()
    };
  }

  // Async version that ensures data is loaded
  async exportDashboardDataAsync() {
    await this.loadData();
    return this.exportDashboardData();
  }

  // Async getter methods
  async getAllReposAsync(): Promise<GitHubRepo[]> {
    await this.loadData();
    return this.getAllRepos();
  }

  async getFeaturedProjectsAsync(limit: number = 6): Promise<GitHubRepo[]> {
    await this.loadData();
    return this.getFeaturedProjects(limit);
  }

  async getSummaryAsync(): Promise<GitHubSummary | null> {
    await this.loadData();
    return this.getSummary();
  }
}

// Create singleton instance
export const projectsParser = new ProjectsParser();

// Helper functions for common usage
export const getAllProjects = async () => {
  await projectsParser.loadData();
  return projectsParser.getAllRepos();
};
export const getFeaturedProjects = async (limit?: number) => {
  await projectsParser.loadData();
  return projectsParser.getFeaturedProjects(limit);
};
export const getProjectByName = async (name: string) => {
  await projectsParser.loadData();
  return projectsParser.getRepoByName(name);
};
export const getProjectsByTech = async (tech: string) => {
  await projectsParser.loadData();
  return projectsParser.getProjectsByTechnology(tech);
};
export const searchProjects = async (query: string) => {
  await projectsParser.loadData();
  return projectsParser.searchProjects(query);
};
export const getProjectMetrics = (repo: GitHubRepo) => projectsParser.getProjectMetrics(repo);