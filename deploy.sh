#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Colors
ORANGE='\033[0;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${ORANGE}▸${NC} $1"; }
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }

# 1. Commit (if there are changes)
step "Checking for changes..."
if [[ -n "$(git status --porcelain)" ]]; then
    git add app/ components/ lib/ public/ scripts/ \
           package.json package-lock.json next.config.mjs \
           tsconfig.json postcss.config.mjs mdx-components.tsx \
           eslint.config.mjs .gitignore CLAUDE.md deploy.sh \
           bradley-io.service ecosystem.config.js \
           wargames-server.js .env 2>/dev/null || true
    git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    ok "Committed"
else
    ok "Working tree clean"
fi

# 2. Bump patch version
step "Bumping version..."
OLD_VER=$(node -p "require('./package.json').version")
NEW_VER=$(npm version patch --no-git-tag-version)
git add package.json package-lock.json 2>/dev/null || git add package.json
git commit -m "bump: ${NEW_VER}" --allow-empty
ok "${OLD_VER} → ${NEW_VER}"

# 3. Push
step "Pushing to origin..."
git push
ok "Pushed"

# 4. Rebuild
step "Building production..."
npm run build
ok "Build complete"

# 5. Restart systemd service (Next.js)
step "Restarting bradley-io service..."
sudo systemctl restart bradley-io
ok "Systemd service restarted"

# 6. Restart PM2 wargames
step "Restarting wargames server..."
if pm2 describe bradley-io-wargames >/dev/null 2>&1; then
    pm2 restart bradley-io-wargames
    ok "Wargames restarted"
else
    pm2 start ecosystem.config.js
    pm2 save
    ok "Wargames started"
fi

# 7. Health check
step "Checking logs..."
sleep 2
if sudo journalctl -u bradley-io --since "5 seconds ago" --no-pager | grep -q "Ready"; then
    ok "Server is ready"
else
    sudo journalctl -u bradley-io --since "10 seconds ago" --no-pager
    fail "Server may not have started cleanly — check logs above"
fi

# 8. HTTP check
step "Testing HTTP response..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:32221)
if [[ "$STATUS" == "200" ]]; then
    ok "http://localhost:32221 → ${STATUS}"
else
    fail "http://localhost:32221 → ${STATUS}"
fi

VER=$(node -p "require('./package.json').version")
echo -e "\n${CYAN}🔥 Deployed v${VER} — bradley.io is live${NC}\n"
