#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Colors
ORANGE='\033[0;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
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

# 2b. Refresh live-data OG card images (fault-tolerant: never fails the deploy)
step "Refreshing live card images..."
bash scripts/gen-card-images.sh || true

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
#
# STAGED: build into .next-staging, and only swap it into place once it has
# actually succeeded. `.next` is what systemd is serving right now, so building
# straight into it means a failed build takes the LIVE SITE down — that is how
# bradley.io ended up serving a 500 on its stylesheet on 2026-08-15.
# next.config.mjs reads NEXT_DIST_DIR; `next start` runs without it and so
# always reads .next.
step "Building production (staged)..."
STAGING=".next-staging"
PREVIOUS=".next-previous"
rm -rf "$STAGING"

if ! NEXT_DIST_DIR="$STAGING" bun run build; then
    rm -rf "$STAGING"
    fail "Build failed — LIVE SITE UNTOUCHED, still serving the previous build"
fi

# Sanity-check the artifact before trusting it. An exit code of 0 with no
# BUILD_ID means something went wrong in a way the build didn't report.
if [[ ! -f "$STAGING/BUILD_ID" ]]; then
    rm -rf "$STAGING"
    fail "Build produced no BUILD_ID — refusing to swap. Live site untouched."
fi

# Swap. Keep the old build until the health check has passed so a rollback is
# a single mv rather than another five-minute build.
rm -rf "$PREVIOUS"
[[ -d .next ]] && mv .next "$PREVIOUS"
mv "$STAGING" .next
ok "Build complete (swapped in; previous kept at ${PREVIOUS})"

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

# 9. Health check — poll until it actually answers.
#
# This used to grep journalctl for "Ready" in a 5-second window and fail()
# outright if it missed, which red-✗'d completely successful deploys and meant
# step 10 (the authoritative check) never even ran. HTTP is the real signal.
step "Waiting for the server..."
STATUS=000
for _ in $(seq 1 20); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:32221 || echo 000)
    [[ "$STATUS" == "200" ]] && break
    sleep 2
done

if [[ "$STATUS" != "200" ]]; then
    echo -e "${RED}Last 30 lines of the service log:${NC}"
    sudo journalctl -u bradley-io -n 30 --no-pager
    # We still have the previous build — put it back rather than leaving the
    # site broken while someone reads the log.
    if [[ -d "$PREVIOUS" ]]; then
        step "ROLLING BACK to the previous build..."
        rm -rf .next
        mv "$PREVIOUS" .next
        sudo systemctl restart bradley-io
        sleep 5
        BACK=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:32221 || echo 000)
        [[ "$BACK" == "200" ]] && ok "Rolled back — site is up on the previous build" \
                               || echo -e "${RED}Rollback did not restore a 200 (got ${BACK})${NC}"
    fi
    fail "http://localhost:32221 → ${STATUS}"
fi
ok "http://localhost:32221 → ${STATUS}"

# 10. Verify the stylesheet, not just the HTML. A half-broken build still
# serves a 200 on / while its CSS 500s — which is exactly what nobody noticed
# on 2026-08-15. Check what the page actually references.
step "Testing CSS..."
CSSPATH=$(curl -s --max-time 5 http://localhost:32221/ | grep -o '/_next/static/[^"]*\.css' | head -1)
if [[ -n "$CSSPATH" ]]; then
    CSSSTATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:32221${CSSPATH}" || echo 000)
    if [[ "$CSSSTATUS" == "200" ]]; then
        ok "stylesheet → ${CSSSTATUS}"
    else
        fail "stylesheet ${CSSPATH} → ${CSSSTATUS} (page would render unstyled)"
    fi
else
    echo -e "${YELLOW}  ⚠ could not find a stylesheet link to test${NC}"
fi

# Health checks passed — the previous build is no longer needed.
rm -rf "$PREVIOUS"

VER=$(node -p "require('./package.json').version")
echo -e "\n${CYAN}🔥 Deployed v${VER} — bradley.io is live${NC}\n"
