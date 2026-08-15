#!/usr/bin/env bash
# =============================================================================
# TEMPORARY — one-shot setup for the unlisted, PIN-gated /junior page.
#
# Idempotent: safe to re-run. Does four things:
#   1. installs + starts junior-ttyd.service   (ttyd on 127.0.0.1:7682)
#   2. installs /etc/nginx/snippets/junior.conf and includes it in the vhost
#   3. generates JUNIOR_PIN + JUNIOR_SECRET into /etc/bradley-io.env
#   4. tests + reloads nginx, restarts the site, prints the PIN
#
# Run:      sudo ./deploy/junior-setup.sh
# Teardown: sudo ./deploy/junior-teardown.sh   (see docs/junior-teardown.md)
# =============================================================================
set -euo pipefail

REPO="/home/bisenbek/projects/bradleyio"
VHOST="/etc/nginx/sites-enabled/bradley.io.nginx"
SNIPPET="/etc/nginx/snippets/junior.conf"
ENVFILE="/etc/bradley-io.env"
BACKUPS="/etc/nginx/backups"
# Anchor line inside the :443 server block; the include goes right after it.
ANCHOR="access_log /var/log/nginx/bradley.io.access.log realip;"

if [[ $EUID -ne 0 ]]; then
  echo "must run as root: sudo $0" >&2
  exit 1
fi

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# --- 1. ttyd service ---------------------------------------------------------
say "installing junior-ttyd.service"
install -m 0644 "$REPO/deploy/junior-ttyd.service" /etc/systemd/system/junior-ttyd.service
systemctl daemon-reload
systemctl enable --now junior-ttyd >/dev/null 2>&1 || true
systemctl restart junior-ttyd
sleep 2
systemctl is-active --quiet junior-ttyd || { echo "junior-ttyd failed to start"; journalctl -u junior-ttyd -n 20 --no-pager; exit 1; }
echo "    junior-ttyd active"

# ttyd has no auth of its own — refuse to continue if it is not loopback-bound.
if ss -tlnH "sport = :7682" | grep -qv '127\.0\.0\.1'; then
  echo "REFUSING: ttyd on :7682 is not bound to 127.0.0.1 only" >&2
  ss -tlnp "sport = :7682" >&2
  exit 1
fi
echo "    :7682 is loopback-only"

# --- 2. PIN + session secret -------------------------------------------------
say "provisioning the PIN gate"
touch "$ENVFILE"; chmod 0640 "$ENVFILE"
if grep -q '^JUNIOR_PIN=' "$ENVFILE"; then
  PIN="$(grep '^JUNIOR_PIN=' "$ENVFILE" | head -1 | cut -d= -f2-)"
  echo "    reusing existing PIN"
else
  PIN="$(python3 -c "import secrets;print(''.join(secrets.choice('0123456789') for _ in range(8)))")"
  printf '\n# TEMPORARY — /junior walkthrough page. Remove at teardown.\n' >> "$ENVFILE"
  printf 'JUNIOR_PIN=%s\n' "$PIN" >> "$ENVFILE"
  echo "    generated a new PIN"
fi
if ! grep -q '^JUNIOR_SECRET=' "$ENVFILE"; then
  printf 'JUNIOR_SECRET=%s\n' "$(python3 -c 'import secrets;print(secrets.token_hex(32))')" >> "$ENVFILE"
fi

# --- 3. nginx ----------------------------------------------------------------
say "wiring nginx"
install -m 0644 "$REPO/deploy/junior-nginx.conf" "$SNIPPET"
echo "    snippet -> $SNIPPET"

if grep -q 'snippets/junior.conf' "$VHOST"; then
  echo "    include already present"
else
  mkdir -p "$BACKUPS"
  # NB: backups live outside sites-enabled on purpose — nginx globs this dir,
  # so a *.bak sitting next to the vhost would get loaded as a second config.
  cp -a "$VHOST" "$BACKUPS/bradley.io.nginx.pre-junior.$(date +%Y%m%d-%H%M%S)"
  python3 - "$VHOST" "$ANCHOR" <<'PY'
import sys
path, anchor = sys.argv[1], sys.argv[2]
src = open(path).read()
if anchor not in src:
    sys.exit(f"anchor line not found in {path}; insert the include by hand")
if src.count(anchor) != 1:
    sys.exit(f"anchor line is not unique in {path}; insert the include by hand")
src = src.replace(
    anchor,
    anchor + "\n\n    # TEMPORARY — unlisted /junior walkthrough page.\n"
             "    include snippets/junior.conf;",
    1,
)
open(path, "w").write(src)
PY
  echo "    include added to $VHOST (backup in $BACKUPS)"
fi

say "testing nginx config"
nginx -t
systemctl reload nginx
echo "    nginx reloaded"

# --- 4. restart the site so it picks up the new env --------------------------
say "restarting bradley-io"
systemctl restart bradley-io
sleep 4
systemctl is-active --quiet bradley-io || { echo "bradley-io failed"; journalctl -u bradley-io -n 20 --no-pager; exit 1; }
echo "    bradley-io active"

# --- verify ------------------------------------------------------------------
say "verifying the gate"
code_unauth="$(curl -s -o /dev/null -w '%{http_code}' https://bradley.io/junior/pty/ || true)"
echo "    GET /junior/pty/ without a cookie -> $code_unauth (want 401)"
[[ "$code_unauth" == "401" ]] || echo "    !! expected 401 — check the auth_request wiring before sharing the URL"

cat <<BANNER

  ------------------------------------------------------------
   /junior is live:   https://bradley.io/junior
   PIN (share verbally):   $PIN
  ------------------------------------------------------------
   Attach from your own terminal with:   tmux attach -t junior
   Tear it all down with:  sudo ./deploy/junior-teardown.sh
  ------------------------------------------------------------

BANNER
