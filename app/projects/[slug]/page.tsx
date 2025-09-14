'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Star, 
  GitFork, 
  Eye,
  Calendar,
  Code,
  ExternalLink,
  Github,
  Download,
  Activity,
  TrendingUp,
  Shield,
  Users,
  Clock,
  FileText,
  Tag,
  BarChart3
} from 'lucide-react';
import { projectsParser, type GitHubRepo, type ProjectMetrics } from '@/lib/projects-parser';

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [project, setProject] = useState<GitHubRepo | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      // Try to find project by name or full name
      let foundProject = projectsParser.getRepoByName(slug);
      
      if (!foundProject) {
        // Try with full name format (org-repo or user-repo)
        const possibleFullNames = [
          `tinymachines/${slug}`,
          `isenbek/${slug}`,
          slug.replace('-', '/') // Handle slug format like "tinymachines-repo"
        ];
        
        for (const fullName of possibleFullNames) {
          foundProject = projectsParser.getRepoByFullName(fullName);
          if (foundProject) break;
        }
      }
      
      if (foundProject) {
        setProject(foundProject);
        setMetrics(projectsParser.getProjectMetrics(foundProject));
      }
      
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The project "{slug}" could not be found.
            </p>
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      TypeScript: '#3178c6',
      JavaScript: '#f7df1e',
      Python: '#3776ab',
      Java: '#ed8b00',
      'C#': '#239120',
      Go: '#00add8',
      Rust: '#dea584',
      PHP: '#777bb4',
      Ruby: '#cc342d',
      Swift: '#fa7343',
      Kotlin: '#7f52ff',
      HTML: '#e34f26',
      CSS: '#1572b6',
      Shell: '#89e051'
    };
    return colors[language] || '#6b7280';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 border-b">
        <div className="container max-w-6xl py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Code className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">{project.name}</h1>
                {project.private && (
                  <Badge variant="secondary">
                    <Shield className="mr-1 h-3 w-3" />
                    Private
                  </Badge>
                )}
                {project.fork && (
                  <Badge variant="outline">
                    <GitFork className="mr-1 h-3 w-3" />
                    Fork
                  </Badge>
                )}
              </div>
              
              <p className="text-lg text-muted-foreground mb-4">
                {project.description || 'No description available'}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.topics.map((topic) => (
                  <Badge key={topic} variant="secondary">
                    <Tag className="mr-1 h-3 w-3" />
                    {topic}
                  </Badge>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {formatDate(project.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Updated {formatDate(project.updated_at)}
                </div>
                {project.language && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getLanguageColor(project.language) }}
                    />
                    {project.language}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button asChild>
                <a href={project.html_url} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={project.clone_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Clone
                  </a>
                </Button>
                {project.release_info?.latest_release && (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={`${project.html_url}/releases`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      {project.release_info.latest_release.tag_name}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* README Summary */}
            {project.readme && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {project.readme.summary}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <a 
                      href={`${project.html_url}#readme`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Read Full README
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Project Metrics */}
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Project Health Metrics
                  </CardTitle>
                  <CardDescription>
                    Automated analysis of code quality, activity, and maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Score</span>
                        <span className="text-sm text-muted-foreground">{metrics.overall}/100</span>
                      </div>
                      <Progress value={metrics.overall} className="h-2" />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Code Quality</span>
                          <span className="text-sm text-muted-foreground">{metrics.codeQuality}/100</span>
                        </div>
                        <Progress value={metrics.codeQuality} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Activity</span>
                          <span className="text-sm text-muted-foreground">{metrics.activity}/100</span>
                        </div>
                        <Progress value={metrics.activity} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Popularity</span>
                          <span className="text-sm text-muted-foreground">{metrics.popularity}/100</span>
                        </div>
                        <Progress value={metrics.popularity} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Maintenance</span>
                          <span className="text-sm text-muted-foreground">{metrics.maintenance}/100</span>
                        </div>
                        <Progress value={metrics.maintenance} className="h-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Language Statistics */}
            {project.language_stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Language Breakdown</CardTitle>
                  <CardDescription>
                    Code composition by programming language
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(project.language_stats.languages)
                      .sort(([,a], [,b]) => b.percentage - a.percentage)
                      .map(([language, stats]) => (
                        <div key={language} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: getLanguageColor(language) }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{language}</span>
                              <span className="text-sm text-muted-foreground">{stats.percentage}%</span>
                            </div>
                            <Progress value={stats.percentage} className="h-1" />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Repository Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Stars</span>
                  </div>
                  <span className="font-mono">{project.stargazers_count.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-4 w-4 text-primary" />
                    <span className="text-sm">Forks</span>
                  </div>
                  <span className="font-mono">{project.forks_count.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-sm">Watchers</span>
                  </div>
                  <span className="font-mono">{project.watchers_count.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Open Issues</span>
                  </div>
                  <span className="font-mono">{project.open_issues_count.toLocaleString()}</span>
                </div>
                
                <Separator />
                
                <div className="text-xs text-muted-foreground">
                  <div>Repository size: {(project.size / 1024).toFixed(1)} MB</div>
                  <div>Default branch: {project.default_branch}</div>
                  {project.license && (
                    <div>License: {project.license.name}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {project.commit_stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Commits this week</span>
                    <span className="font-mono">{project.commit_stats.commit_frequency}</span>
                  </div>
                  
                  {project.commit_stats.last_commit && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Latest Commit</div>
                      <div className="text-xs text-muted-foreground">
                        <div className="font-mono bg-muted p-2 rounded text-xs">
                          {project.commit_stats.last_commit.message.slice(0, 50)}
                          {project.commit_stats.last_commit.message.length > 50 && '...'}
                        </div>
                        <div className="mt-1">
                          by {project.commit_stats.last_commit.author} • {formatDate(project.commit_stats.last_commit.date)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Releases */}
            {project.release_info && project.release_info.total_releases > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Releases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total releases</span>
                    <span className="font-mono">{project.release_info.total_releases}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Latest Release</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {project.release_info.latest_release.tag_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(project.release_info.latest_release.published_at)}
                        </span>
                      </div>
                      <div className="text-sm">{project.release_info.latest_release.name}</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a 
                      href={`${project.html_url}/releases`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      View All Releases
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}