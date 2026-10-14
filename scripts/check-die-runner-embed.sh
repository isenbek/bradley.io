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

# Usage:  check-die-runner-embed.sh [origin] [url]
#   origin  the site that frames the page (default https://bradley.io; beta.bradley.io for the beta, issue #7)
#   url     the page it frames (default the Die Runner cartridge; tinychase.com/lab/tf2 for scene 6, issue #8)
# Only the LAST response after redirects is judged: the cartridge address is a 301 whose own CSP never applies to
# the framed page. Exit 0 when that page answers 200 and lets the origin frame it.

ORIGIN="${1:-https://bradley.io}"
CART="${2:-https://games.tinymachines.ai/b/tinymachines/die-runner}"
API="https://6502.tinymachines.ai/api/v1/console"

all=$(curl -sS -L -D - -o /dev/null --max-time 15 "$CART" 2>&1)
# the last header block: everything after the last status line
last=$(printf '%s\n' "$all" | awk 'toupper($1) ~ /^HTTP/ {buf=""} {buf=buf $0 "\n"} END {printf "%s", buf}')
code=$(printf '%s\n' "$last" | awk 'toupper($1) ~ /^HTTP/ {print $2; exit}')
xfo=$(printf '%s\n' "$last" | grep -i '^x-frame-options:' | tr -d '\r')
fa=$(printf '%s\n' "$last" | grep -i '^content-security-policy:' | tr -d '\r' | grep -oi "frame-ancestors[^;]*")
final=$(curl -sS -L -o /dev/null -w '%{url_effective}' --max-time 15 "$CART" 2>/dev/null)

echo "origin    $ORIGIN"
echo "page      $CART"
echo "lands at  ${final:-?}"
echo "status    ${code:-no answer}"
echo "x-frame   ${xfo:-none}"
echo "framing   ${fa:-no frame-ancestors (any site may frame it)}"

ok=0
if [ "${code:-}" != "200" ]; then echo "FAIL  the page did not answer 200"; ok=1; fi
if [ -n "$xfo" ]; then echo "FAIL  X-Frame-Options is set; no other site can frame this page"; ok=1; fi
if [ -n "$fa" ] && ! printf ' %s ' "$fa" | grep -qF " $ORIGIN "; then
  echo "FAIL  frame-ancestors does not name $ORIGIN"; ok=1
fi

case "$CART" in
  *die-runner*)
    api=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$API" 2>/dev/null || echo "no answer")
    echo "engine    $API -> $api"
    if [ "$api" != "200" ]; then echo "WARN  the console endpoint did not answer 200; the game will boot to an error until it does"; fi ;;
esac

if [ "$ok" -eq 0 ]; then echo "OK    $ORIGIN can frame $CART"; fi
exit "$ok"
