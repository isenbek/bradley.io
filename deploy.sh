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

# 0. Toolchain check — Bun is the package manager for this project.
step "Checking toolchain..."
command -v bun >/dev/null 2>&1 || fail "bun is not installed (https://bun.sh)"
ok "bun $(bun --version)"

# 1. Install deps (idempotent — fast no-op when up to date)
step "Installing deps via bun..."
bun install --frozen-lockfile
ok "Deps in sync"

# 2. Lint
step "Running lint..."
bun run lint
ok "Lint passed"

# 3. Commit (if there are changes)
step "Checking for changes..."
if [[ -n "$(git status --porcelain)" ]]; then
    git add app/ components/ lib/ public/ scripts/ tests/ \
           package.json bun.lock next.config.mjs playwright.config.ts \
           tsconfig.json postcss.config.mjs mdx-components.tsx \
           eslint.config.mjs .gitignore CLAUDE.md deploy.sh \
           bradley-io.service bradley-cam.service bradley-cam.timer ecosystem.config.js \
           wargames-server.js .env 2>/dev/null || true
    git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    ok "Committed"
else
    ok "Working tree clean"
fi

# 4. Bump patch version
step "Bumping version..."
OLD_VER=$(node -p "require('./package.json').version")
# `bun pm version` already prints a leading "v"; the node fallback doesn't.
# Strip any leading "v" then add exactly one, so we never get "vv1.0.x".
RAW_VER=$(bun pm version patch --no-git-tag-version 2>/dev/null || \
            node -e "const p=require('./package.json');const v=p.version.split('.');v[2]=String(+v[2]+1);p.version=v.join('.');require('fs').writeFileSync('./package.json',JSON.stringify(p,null,2)+'\n');console.log(p.version)")
NEW_VER="v${RAW_VER#v}"
git add package.json bun.lock 2>/dev/null || git add package.json
git commit -m "bump: ${NEW_VER}" --allow-empty
ok "${OLD_VER} → ${NEW_VER}"

# 5. Build (before push — fail fast)
step "Building production..."
bun run build
ok "Build complete"

# 5b. Sync build-info — the build just regenerated lib/build-info.json with
# the bumped version. Commit it so the repo's version pill matches what we're
# deploying (otherwise the committed pill lags one deploy behind).
step "Syncing build-info..."
if [[ -n "$(git status --porcelain lib/build-info.json)" ]]; then
    git add lib/build-info.json
    git commit -m "build-info: ${NEW_VER}"
    ok "build-info committed (${NEW_VER})"
else
    ok "build-info already in sync"
fi

# 6. Push
step "Pushing to origin..."
git push
ok "Pushed"

# 7. Restart systemd service (Next.js)
step "Restarting bradley-io service..."
sudo systemctl restart bradley-io
ok "Systemd service restarted"

# 8. Restart PM2 wargames
step "Restarting wargames server..."
if pm2 describe bradley-io-wargames >/dev/null 2>&1; then
    pm2 restart bradley-io-wargames
    ok "Wargames restarted"
else
    pm2 start ecosystem.config.js
    pm2 save
    ok "Wargames started"
fi

# 9. Health check
step "Checking logs..."
sleep 2
if sudo journalctl -u bradley-io --since "5 seconds ago" --no-pager | grep -q "Ready"; then
    ok "Server is ready"
else
    sudo journalctl -u bradley-io --since "10 seconds ago" --no-pager
    fail "Server may not have started cleanly — check logs above"
fi

# 10. HTTP check
step "Testing HTTP response..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:32221)
if [[ "$STATUS" == "200" ]]; then
    ok "http://localhost:32221 → ${STATUS}"
else
    fail "http://localhost:32221 → ${STATUS}"
fi

VER=$(node -p "require('./package.json').version")
echo -e "\n${CYAN}🔥 Deployed v${VER} — bradley.io is live${NC}\n"
