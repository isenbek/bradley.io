#!/usr/bin/env node
/**
 * Generate build info JSON file with git metadata
 * Run during build: node scripts/generate-build-info.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitInfo() {
  try {
    // Get the latest tag or fallback to package.json version
    let version;
    try {
      version = execSync('git describe --tags --abbrev=0 2>/dev/null', { encoding: 'utf8' }).trim();
    } catch {
      // No tags found, use package.json version
      const pkg = require('../package.json');
      version = `v${pkg.version}`;
    }

    // Get short commit hash
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

    // Get full commit hash
    const commitHashFull = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

    // Get commit date
    const commitDate = execSync('git log -1 --format=%ci', { encoding: 'utf8' }).trim();

    // Parse and format the date
    const date = new Date(commitDate);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Get branch name
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    return {
      version,
      commitHash,
      commitHashFull,
      commitDate: `${formattedDate} ${formattedTime}`,
      commitDateISO: date.toISOString(),
      branch,
      buildTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting git info:', error.message);
    return {
      version: 'v0.1.0',
      commitHash: 'unknown',
      commitHashFull: 'unknown',
      commitDate: 'Unknown',
      commitDateISO: new Date().toISOString(),
      branch: 'unknown',
      buildTime: new Date().toISOString(),
    };
  }
}

const buildInfo = getGitInfo();
const outputPath = path.join(__dirname, '..', 'lib', 'build-info.json');

// Ensure lib directory exists
const libDir = path.dirname(outputPath);
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));
console.log('Build info generated:', buildInfo);
