#!/bin/bash
set -e

# Bradley.io Deploy Script
# Usage: ./deploy.sh [commit message]
# Runs: pipeline → build → commit → version bump → push → PM2 restart

cd "$(dirname "$0")"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${YELLOW}▸ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

# ── 1. Run AI Pilot pipeline ──────────────────────────────────────
step "Running AI Pilot data pipeline..."
if python3 scripts/ai-pilot-pipeline.py 2>/dev/null; then
  ok "Pipeline complete"
else
  echo "  (pipeline skipped or failed — continuing)"
fi

# ── 2. Build ──────────────────────────────────────────────────────
step "Building for production..."
npm run build || fail "Build failed"
ok "Build succeeded"

# ── 3. Stage & Commit ─────────────────────────────────────────────
step "Staging changes..."
git add app/ components/ lib/ public/ scripts/ styles/ \
       package.json package-lock.json next.config.ts \
       tsconfig.json tailwind.config.ts postcss.config.mjs \
       .gitignore CLAUDE.md deploy.sh 2>/dev/null || true

if git diff --cached --quiet; then
  echo "  No changes to commit — skipping commit/push"
else
  MSG="${1:-Deploy: $(date '+%Y-%m-%d %H:%M')}"
  step "Committing: $MSG"
  git commit -m "$MSG"
  ok "Committed"

  # ── 4. Version bump ───────────────────────────────────────────
  step "Bumping patch version..."
  NEW_VER=$(npm version patch --no-git-tag-version)
  git add package.json package-lock.json
  git commit -m "chore: bump to $NEW_VER"
  ok "Version: $NEW_VER"

  # ── 5. Push ─────────────────────────────────────────────────────
  step "Pushing to origin..."
  git push origin main
  ok "Pushed"
fi

# ── 6. Restart PM2 services ──────────────────────────────────────
step "Restarting PM2 services..."

# Kill dev server if running
pkill -f "next dev" 2>/dev/null || true
sleep 1

if pm2 describe bradley-io-web >/dev/null 2>&1; then
  pm2 restart ecosystem.config.js
  ok "PM2 services restarted"
else
  pm2 start ecosystem.config.js
  pm2 save
  ok "PM2 services started"
fi

echo ""
pm2 status
echo -e "\n${GREEN}Deploy complete!${NC}"
