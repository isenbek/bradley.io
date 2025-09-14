#!/usr/bin/env node

/**
 * GitHub Data Sync Script
 * 
 * This script fetches comprehensive data from GitHub repositories including:
 * - Repository metadata
 * - README content
 * - Language statistics  
 * - Commit statistics
 * - Release information
 * - Issues and PR data
 * 
 * Run with: node scripts/sync-github-data.js
 * Or add to cron: 0 * * * * /usr/bin/node /path/to/scripts/sync-github-data.js
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  ORG_NAME: 'tinymachines',
  USER_NAME: 'isenbek',
  OUTPUT_DIR: path.join(__dirname, '..', 'data'),
  MAX_REPOS: 50,
  REQUEST_DELAY: 100, // ms between requests to avoid rate limiting
};

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.access(CONFIG.OUTPUT_DIR);
  } catch {
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
  }
}

// Rate limiting helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GitHub API request helper
async function githubRequest(url) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'bradley-io-sync-script'
  };
  
  if (CONFIG.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${CONFIG.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 403) {
        console.warn(`Rate limited for URL: ${url}`);
        return null;
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

// Fetch README content and convert to summary
async function fetchReadmeContent(owner, repo) {
  try {
    const readmeData = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/readme`);
    if (!readmeData) return null;

    // Decode base64 content
    const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
    
    // Extract summary from README (first paragraph or first 200 chars)
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const firstParagraph = lines.find(line => line.length > 20);
    
    let summary = firstParagraph || content.slice(0, 200);
    
    // Clean up markdown syntax
    summary = summary
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/[*_`#]/g, '') // Remove markdown formatting
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return {
      summary: summary.slice(0, 300) + (summary.length > 300 ? '...' : ''),
      fullContent: content,
      size: readmeData.size
    };
  } catch (error) {
    console.warn(`Could not fetch README for ${owner}/${repo}:`, error.message);
    return null;
  }
}

// Fetch language statistics
async function fetchLanguageStats(owner, repo) {
  try {
    const languages = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/languages`);
    if (!languages) return null;

    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    const languagePercentages = {};
    
    Object.entries(languages).forEach(([lang, bytes]) => {
      languagePercentages[lang] = {
        bytes,
        percentage: Math.round((bytes / total) * 100)
      };
    });

    return {
      total_bytes: total,
      languages: languagePercentages,
      primary_language: Object.keys(languages)[0] || null
    };
  } catch (error) {
    console.warn(`Could not fetch languages for ${owner}/${repo}:`, error.message);
    return null;
  }
}

// Fetch commit statistics
async function fetchCommitStats(owner, repo) {
  try {
    // Get recent commits (last 30)
    const commits = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`);
    if (!commits) return null;

    const stats = {
      total_commits: commits.length,
      recent_commits: commits.length,
      last_commit: commits[0] ? {
        sha: commits[0].sha,
        message: commits[0].commit.message,
        author: commits[0].commit.author.name,
        date: commits[0].commit.author.date
      } : null,
      commit_frequency: commits.length > 0 ? calculateCommitFrequency(commits) : 0
    };

    return stats;
  } catch (error) {
    console.warn(`Could not fetch commits for ${owner}/${repo}:`, error.message);
    return null;
  }
}

// Calculate commit frequency (commits per week)
function calculateCommitFrequency(commits) {
  if (commits.length === 0) return 0;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentCommits = commits.filter(commit => 
    new Date(commit.commit.author.date) > oneWeekAgo
  );
  
  return recentCommits.length;
}

// Fetch release information
async function fetchReleaseInfo(owner, repo) {
  try {
    const releases = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=5`);
    if (!releases || releases.length === 0) return null;

    return {
      total_releases: releases.length,
      latest_release: {
        tag_name: releases[0].tag_name,
        name: releases[0].name,
        published_at: releases[0].published_at,
        body: releases[0].body ? releases[0].body.slice(0, 200) + '...' : null
      },
      releases: releases.map(release => ({
        tag_name: release.tag_name,
        name: release.name,
        published_at: release.published_at,
        download_count: release.assets.reduce((sum, asset) => sum + asset.download_count, 0)
      }))
    };
  } catch (error) {
    console.warn(`Could not fetch releases for ${owner}/${repo}:`, error.message);
    return null;
  }
}

// Enhance repository data with additional information
async function enhanceRepoData(repo) {
  const owner = repo.owner.login;
  const repoName = repo.name;
  
  console.log(`Enhancing data for ${owner}/${repoName}...`);
  
  // Fetch additional data in parallel
  const [readme, languages, commits, releases] = await Promise.all([
    fetchReadmeContent(owner, repoName),
    fetchLanguageStats(owner, repoName),
    fetchCommitStats(owner, repoName),
    fetchReleaseInfo(owner, repoName)
  ]);

  await delay(CONFIG.REQUEST_DELAY); // Rate limiting

  return {
    // Basic repo data
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    clone_url: repo.clone_url,
    ssh_url: repo.ssh_url,
    
    // Repository metadata
    private: repo.private,
    fork: repo.fork,
    archived: repo.archived,
    disabled: repo.disabled,
    
    // Timestamps
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    
    // Statistics
    size: repo.size,
    stargazers_count: repo.stargazers_count,
    watchers_count: repo.watchers_count,
    forks_count: repo.forks_count,
    open_issues_count: repo.open_issues_count,
    
    // Repository settings
    default_branch: repo.default_branch,
    language: repo.language,
    topics: repo.topics || [],
    license: repo.license ? {
      key: repo.license.key,
      name: repo.license.name,
      spdx_id: repo.license.spdx_id
    } : null,
    
    // Enhanced data
    readme: readme,
    language_stats: languages,
    commit_stats: commits,
    release_info: releases,
    
    // Metadata
    last_synced: new Date().toISOString(),
    sync_version: '1.0'
  };
}

// Fetch repositories from organization
async function fetchOrgRepos() {
  console.log(`Fetching repositories from organization: ${CONFIG.ORG_NAME}`);
  
  const repos = [];
  let page = 1;
  
  while (repos.length < CONFIG.MAX_REPOS) {
    const pageRepos = await githubRequest(
      `https://api.github.com/orgs/${CONFIG.ORG_NAME}/repos?type=all&sort=updated&per_page=30&page=${page}`
    );
    
    if (!pageRepos || pageRepos.length === 0) break;
    
    repos.push(...pageRepos);
    page++;
    
    await delay(CONFIG.REQUEST_DELAY);
  }
  
  // Filter out archived and disabled repos, limit to MAX_REPOS
  return repos
    .filter(repo => !repo.archived && !repo.disabled)
    .slice(0, CONFIG.MAX_REPOS);
}

// Fetch repositories from user
async function fetchUserRepos() {
  console.log(`Fetching repositories from user: ${CONFIG.USER_NAME}`);
  
  const repos = [];
  let page = 1;
  
  while (repos.length < CONFIG.MAX_REPOS) {
    const pageRepos = await githubRequest(
      `https://api.github.com/users/${CONFIG.USER_NAME}/repos?type=all&sort=updated&per_page=30&page=${page}`
    );
    
    if (!pageRepos || pageRepos.length === 0) break;
    
    repos.push(...pageRepos);
    page++;
    
    await delay(CONFIG.REQUEST_DELAY);
  }
  
  // Filter out archived and disabled repos, limit to MAX_REPOS
  return repos
    .filter(repo => !repo.archived && !repo.disabled)
    .slice(0, CONFIG.MAX_REPOS);
}

// Main sync function
async function syncGitHubData() {
  console.log('🚀 Starting GitHub data sync...');
  console.log(`Rate limiting: ${CONFIG.REQUEST_DELAY}ms between requests`);
  
  if (!CONFIG.GITHUB_TOKEN) {
    console.warn('⚠️  No GITHUB_TOKEN found. Rate limits will be lower.');
  }
  
  try {
    await ensureOutputDir();
    
    // Fetch both org and user repos
    const [orgRepos, userRepos] = await Promise.all([
      fetchOrgRepos(),
      fetchUserRepos()
    ]);
    
    console.log(`📊 Found ${orgRepos.length} org repos and ${userRepos.length} user repos`);
    
    // Enhance repo data
    const enhancedOrgRepos = [];
    for (const repo of orgRepos) {
      const enhanced = await enhanceRepoData(repo);
      enhancedOrgRepos.push(enhanced);
    }
    
    const enhancedUserRepos = [];
    for (const repo of userRepos) {
      const enhanced = await enhanceRepoData(repo);
      enhancedUserRepos.push(enhanced);
    }
    
    // Generate summary statistics
    const summary = {
      last_updated: new Date().toISOString(),
      org_stats: {
        total_repos: enhancedOrgRepos.length,
        total_stars: enhancedOrgRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        total_forks: enhancedOrgRepos.reduce((sum, repo) => sum + repo.forks_count, 0),
        languages: [...new Set(enhancedOrgRepos.map(repo => repo.language).filter(Boolean))],
        most_popular: enhancedOrgRepos.sort((a, b) => b.stargazers_count - a.stargazers_count)[0]
      },
      user_stats: {
        total_repos: enhancedUserRepos.length,
        total_stars: enhancedUserRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        total_forks: enhancedUserRepos.reduce((sum, repo) => sum + repo.forks_count, 0),
        languages: [...new Set(enhancedUserRepos.map(repo => repo.language).filter(Boolean))],
        most_popular: enhancedUserRepos.sort((a, b) => b.stargazers_count - a.stargazers_count)[0]
      }
    };
    
    // Write data files
    await Promise.all([
      fs.writeFile(
        path.join(CONFIG.OUTPUT_DIR, 'github-org-repos.json'),
        JSON.stringify(enhancedOrgRepos, null, 2)
      ),
      fs.writeFile(
        path.join(CONFIG.OUTPUT_DIR, 'github-user-repos.json'),
        JSON.stringify(enhancedUserRepos, null, 2)
      ),
      fs.writeFile(
        path.join(CONFIG.OUTPUT_DIR, 'github-summary.json'),
        JSON.stringify(summary, null, 2)
      )
    ]);
    
    console.log('✅ GitHub data sync completed successfully!');
    console.log(`📁 Data saved to: ${CONFIG.OUTPUT_DIR}`);
    console.log(`📈 Total repos synced: ${enhancedOrgRepos.length + enhancedUserRepos.length}`);
    
  } catch (error) {
    console.error('❌ Error during GitHub sync:', error);
    process.exit(1);
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncGitHubData();
}

module.exports = { syncGitHubData };