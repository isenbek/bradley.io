import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';
import type { GitHubRepo, GitHubSummary } from '@/lib/projects-parser';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data');
    
    let orgRepos: GitHubRepo[] = [];
    let userRepos: GitHubRepo[] = [];
    let summary: GitHubSummary | null = null;

    // Load org repos
    try {
      const orgData = readFileSync(path.join(dataPath, 'github-org-repos.json'), 'utf-8');
      orgRepos = JSON.parse(orgData);
    } catch (error) {
      console.warn('Could not load org repos data:', error);
    }

    // Load user repos
    try {
      const userData = readFileSync(path.join(dataPath, 'github-user-repos.json'), 'utf-8');
      userRepos = JSON.parse(userData);
    } catch (error) {
      console.warn('Could not load user repos data:', error);
    }

    // Load summary
    try {
      const summaryData = readFileSync(path.join(dataPath, 'github-summary.json'), 'utf-8');
      summary = JSON.parse(summaryData);
    } catch (error) {
      console.warn('Could not load summary data:', error);
    }

    return NextResponse.json({
      orgRepos,
      userRepos,
      summary
    });
  } catch (error) {
    console.error('Error loading projects data:', error);
    return NextResponse.json({ error: 'Failed to load projects data' }, { status: 500 });
  }
}