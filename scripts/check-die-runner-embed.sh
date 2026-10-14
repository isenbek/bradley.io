#!/usr/bin/env bash
# check-die-runner-embed.sh: can bradley.io frame the Die Runner console?
#
# The front page (components/home/DieRunner.tsx) boots
# https://games.tinymachines.ai/b/tinymachines/die-runner in an iframe. A
# browser refuses that silently if the games host sends X-Frame-Options or a
# Content-Security-Policy frame-ancestors that leaves bradley.io out, and the
# reader sees an empty sunk panel with no error anywhere. This asks the host
# what it sends, from the server, before anyone deploys the section.
#
# Run on the server after pulling:  bash scripts/check-die-runner-embed.sh
# Exit 0 = framing allowed and the page answers. Exit 1 = fix nginx for
# games.tinymachines.ai first (drop X-Frame-Options, or add
# `add_header Content-Security-Policy "frame-ancestors 'self' https://bradley.io";`).
#
# Added 2026-10-14 with the Die Runner front-page section.

set -u

CART="https://games.tinymachines.ai/b/tinymachines/die-runner"
API="https://6502.tinymachines.ai/api/v1/console"

hdr=$(curl -sS -I -L --max-time 15 "$CART" 2>&1)
code=$(printf '%s\n' "$hdr" | awk 'toupper($1) ~ /^HTTP/ {c=$2} END {print c}')
xfo=$(printf '%s\n' "$hdr" | grep -i '^x-frame-options:' | tr -d '\r')
csp=$(printf '%s\n' "$hdr" | grep -i '^content-security-policy:' | tr -d '\r')

echo "page      $CART"
echo "status    ${code:-no answer}"
echo "x-frame   ${xfo:-none}"
echo "csp       ${csp:-none}"

ok=0
if [ "${code:-}" != "200" ]; then
  echo "FAIL  the cartridge page did not answer 200"; ok=1
fi
if [ -n "$xfo" ]; then
  echo "FAIL  X-Frame-Options is set; bradley.io cannot frame this page"; ok=1
fi
if [ -n "$csp" ] && printf '%s' "$csp" | grep -qi 'frame-ancestors' && ! printf '%s' "$csp" | grep -qi 'bradley.io'; then
  echo "FAIL  frame-ancestors does not name bradley.io"; ok=1
fi

api=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$API" 2>/dev/null || echo "no answer")
echo "engine    $API -> $api"
if [ "$api" != "200" ]; then
  echo "WARN  the console endpoint did not answer 200; the game will boot to an error until it does"
fi

if [ "$ok" -eq 0 ]; then echo "OK    bradley.io can frame the console"; fi
exit "$ok"
