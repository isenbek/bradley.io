#!/usr/bin/env bash
# =============================================================================
# TEMPORARY — bring the unlisted /junior walkthrough page up, end to end.
#
# Wraps the two steps that have to happen in this order:
#   1. ./deploy.sh                    (as you) — build + ship the page
#   2. sudo ./deploy/junior-setup.sh  (as root) — ttyd, nginx, PIN
#
# The order matters: the setup script's last act is to curl the gate and
# assert it returns 401, which only works once /api/junior/check is live in
# the running build.
#
# Run:      ./scripts/junior-up.sh
# Undo:     sudo ./deploy/junior-teardown.sh   (see docs/junior-teardown.md)
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

ORANGE='\033[0;33m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
step() { echo -e "\n${ORANGE}▸${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }

# deploy.sh does git + bun work as the repo owner; running the whole thing
# under sudo would leave root-owned files in .next and the git objects.
[[ $EUID -eq 0 ]] && fail "run this as bisenbek, not root — it sudo's only the part that needs it"

# systemd units and cron/ssh invocations don't get the interactive shell's
# PATH, so the toolchain has to be named explicitly.
export PATH="/home/bisenbek/.bun/bin:/home/bisenbek/.nvm/versions/node/v24.0.1/bin:$PATH"
command -v bun  >/dev/null 2>&1 || fail "bun not on PATH"
command -v node >/dev/null 2>&1 || fail "node not on PATH"

step "1/2 — deploying the site"
# deploy.sh's step 9 greps journalctl for "Ready" in a 5s window; when Next
# takes longer to boot it exits 1 without ever reaching its own HTTP check,
# even though the deploy landed fine. So don't trust the exit code alone —
# ask the server directly.
deploy_rc=0
./deploy.sh || deploy_rc=$?

if [[ $deploy_rc -ne 0 ]]; then
  echo -e "  ${ORANGE}!${NC} deploy.sh exited ${deploy_rc} — verifying the site directly"
  health=""
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    health="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:32221/ || true)"
    [[ "$health" == "200" ]] && break
    sleep 2
  done
  [[ "$health" == "200" ]] || fail "site is not serving (localhost:32221 -> ${health:-no response}) — fix the deploy before exposing a shell"
  echo -e "  ${GREEN}✓${NC} site is serving 200 — deploy.sh's log check was a false negative, continuing"
fi

step "2/2 — standing up the shell, nginx route and PIN"
# Prompt for the password up front rather than midway through the script.
sudo -v || fail "sudo required for the ttyd unit, the nginx snippet and /etc/bradley-io.env"
sudo ./deploy/junior-setup.sh

echo -e "\n${GREEN}✓${NC} /junior is up. The PIN is printed just above — share it verbally."
