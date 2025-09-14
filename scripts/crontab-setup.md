# GitHub Data Sync Cron Setup

This document provides instructions for setting up the GitHub data sync script to run automatically every hour.

## Prerequisites

1. **GitHub Personal Access Token** (recommended for higher rate limits)
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate a new token with `public_repo` scope
   - Set the environment variable: `export GITHUB_TOKEN=your_token_here`

2. **Node.js Environment**
   - Ensure Node.js is installed and accessible via cron
   - Test the script manually first: `node /path/to/scripts/sync-github-data.js`

## Cron Job Setup

### Option 1: Edit crontab directly

```bash
# Open crontab for editing
crontab -e

# Add this line to run every hour at minute 0
0 * * * * /usr/bin/node /home/bisenbek/projects/bradleyio/scripts/sync-github-data.js >> /var/log/github-sync.log 2>&1

# Or run every 30 minutes
0,30 * * * * /usr/bin/node /home/bisenbek/projects/bradleyio/scripts/sync-github-data.js >> /var/log/github-sync.log 2>&1
```

### Option 2: Use the setup script

Create a setup script for easier management:

```bash
#!/bin/bash
# Save as setup-cron.sh

PROJECT_DIR="/home/bisenbek/projects/bradleyio"
SCRIPT_PATH="$PROJECT_DIR/scripts/sync-github-data.js"
LOG_PATH="/var/log/github-sync.log"

# Ensure log file exists and is writable
sudo touch $LOG_PATH
sudo chmod 666 $LOG_PATH

# Add to crontab (every hour)
(crontab -l 2>/dev/null; echo "0 * * * * /usr/bin/node $SCRIPT_PATH >> $LOG_PATH 2>&1") | crontab -

echo "✅ Cron job added successfully!"
echo "📝 Logs will be written to: $LOG_PATH"
echo "🔍 Check status with: tail -f $LOG_PATH"
```

## Environment Variables for Cron

Create a `.env` file in the project root or set system-wide:

```bash
# In your project directory
echo "GITHUB_TOKEN=your_token_here" > .env

# Or add to system environment
echo 'export GITHUB_TOKEN=your_token_here' >> ~/.bashrc
```

For cron to access environment variables, you may need to source them:

```bash
# Modified cron entry that sources environment
0 * * * * /bin/bash -c 'source /home/bisenbek/.bashrc && /usr/bin/node /home/bisenbek/projects/bradleyio/scripts/sync-github-data.js' >> /var/log/github-sync.log 2>&1
```

## Verification and Monitoring

### Check if cron job is active:
```bash
crontab -l
```

### Monitor the sync:
```bash
# Watch the log file
tail -f /var/log/github-sync.log

# Check the generated data files
ls -la /home/bisenbek/projects/bradleyio/data/

# Verify JSON content
cat /home/bisenbek/projects/bradleyio/data/github-summary.json | jq .
```

### Test the script manually:
```bash
cd /home/bisenbek/projects/bradleyio
node scripts/sync-github-data.js
```

## Troubleshooting

### Common Issues:

1. **Permission denied**: Ensure the script is executable
   ```bash
   chmod +x /home/bisenbek/projects/bradleyio/scripts/sync-github-data.js
   ```

2. **Node.js not found**: Use full path to node
   ```bash
   which node  # Find the full path
   ```

3. **Environment variables not loaded**: Use full environment setup in cron
   ```bash
   0 * * * * cd /home/bisenbek/projects/bradleyio && /usr/bin/env NODE_ENV=production GITHUB_TOKEN=your_token /usr/bin/node scripts/sync-github-data.js >> /var/log/github-sync.log 2>&1
   ```

4. **Rate limiting**: Ensure GITHUB_TOKEN is properly set
   - Without token: 60 requests/hour
   - With token: 5000 requests/hour

### Log Analysis:
```bash
# Check for errors
grep -i error /var/log/github-sync.log

# Check sync frequency
grep "sync completed" /var/log/github-sync.log | tail -5

# Monitor file updates
stat /home/bisenbek/projects/bradleyio/data/github-summary.json
```

## Advanced Configuration

### Rate Limiting Adjustment:
Edit the script's CONFIG object to adjust request delays:

```javascript
const CONFIG = {
  REQUEST_DELAY: 200, // Increase for slower rate
  MAX_REPOS: 100,     // Increase to fetch more repos
  // ... other options
};
```

### Multiple GitHub Accounts:
Run separate cron jobs for different accounts:

```bash
# Org repos (every hour)
0 * * * * cd /home/bisenbek/projects/bradleyio && GITHUB_ORG=tinymachines /usr/bin/node scripts/sync-github-data.js

# Personal repos (every 2 hours)
0 */2 * * * cd /home/bisenbek/projects/bradleyio && GITHUB_USER=isenbek /usr/bin/node scripts/sync-github-data.js
```

## Data File Locations

After successful sync, these files will be created/updated:

- `/home/bisenbek/projects/bradleyio/data/github-org-repos.json` - Organization repositories
- `/home/bisenbek/projects/bradleyio/data/github-user-repos.json` - User repositories  
- `/home/bisenbek/projects/bradleyio/data/github-summary.json` - Summary statistics

## Next.js Integration

The sync script generates data that's automatically consumed by:

- `lib/projects-parser.ts` - Data parsing and analysis
- `app/projects/page.tsx` - Projects listing page
- `app/projects/[slug]/page.tsx` - Individual project pages

No additional configuration needed - the Next.js app will automatically use the latest synced data on each page load.