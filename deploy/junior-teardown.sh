#!/usr/bin/env bash
# =============================================================================
# Tear down the temporary /junior page and everything it stood up.
# Run: sudo ./deploy/junior-teardown.sh
#
# This removes the SERVER-SIDE exposure (the shell, the nginx route, the PIN).
# It does not delete the page source — see docs/junior-teardown.md for the
# `git rm` list, which you run afterwards followed by ./deploy.sh.
# =============================================================================
set -euo pipefail

VHOST="/etc/nginx/sites-enabled/bradley.io.nginx"
SNIPPET="/etc/nginx/snippets/junior.conf"
ENVFILE="/etc/bradley-io.env"
BACKUPS="/etc/nginx/backups"

if [[ $EUID -ne 0 ]]; then
  echo "must run as root: sudo $0" >&2
  exit 1
fi

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

say "stopping the shell"
systemctl disable --now junior-ttyd >/dev/null 2>&1 || true
rm -f /etc/systemd/system/junior-ttyd.service
systemctl daemon-reload
# Kill the shared tmux session too, so no detached shell lingers.
sudo -u bisenbek tmux kill-session -t junior 2>/dev/null || true
echo "    junior-ttyd removed, tmux session killed"

say "unwiring nginx"
if grep -q 'snippets/junior.conf' "$VHOST"; then
  mkdir -p "$BACKUPS"
  cp -a "$VHOST" "$BACKUPS/bradley.io.nginx.pre-teardown.$(date +%Y%m%d-%H%M%S)"
  python3 - "$VHOST" <<'PY'
import re, sys
path = sys.argv[1]
src = open(path).read()
src = re.sub(r"\n\n?[ \t]*# TEMPORARY — unlisted /junior walkthrough page\.\n[ \t]*include snippets/junior\.conf;", "", src)
src = re.sub(r"\n[ \t]*include snippets/junior\.conf;", "", src)
open(path, "w").write(src)
PY
  echo "    include removed"
fi
rm -f "$SNIPPET"
nginx -t
systemctl reload nginx
echo "    nginx reloaded"

say "revoking the PIN"
if [[ -f "$ENVFILE" ]]; then
  sed -i '/^JUNIOR_PIN=/d; /^JUNIOR_SECRET=/d; /^# TEMPORARY — \/junior walkthrough page/d' "$ENVFILE"
  echo "    JUNIOR_PIN + JUNIOR_SECRET removed from $ENVFILE"
fi

say "restarting bradley-io"
systemctl restart bradley-io
sleep 3
systemctl is-active --quiet bradley-io && echo "    bradley-io active"

say "optionally remove ttyd itself"
echo "    apt-get purge ttyd   # only if you don't want it around"

cat <<'BANNER'

  ------------------------------------------------------------
   Server-side teardown complete. The shell is gone and the
   PIN no longer validates, so /junior can no longer be opened.

   Now remove the page source (see docs/junior-teardown.md):
     git rm -r app/junior app/api/junior components/junior \
              lib/junior-session.ts deploy/junior-*
     # then drop the /junior CSS block from app/v3.css
     # and the "/junior" entry from app/robots.ts
     ./deploy.sh
  ------------------------------------------------------------

BANNER
