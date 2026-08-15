#!/usr/bin/env bash
# =============================================================================
# TEMPORARY — watch Armando's Pi 5 for USB ethernet adapters being plugged in.
#
# Polls the interface list over the wg-pi5 tunnel and prints ONE LINE per
# change, so it works as a Monitor source and stays quiet otherwise.
#
# For each new interface it reports the MAC and the driver that claimed it —
# the two things we need to pin wan1/wan2 to physical hardware rather than to
# kernel enumeration order (which can swap across reboots and silently trade
# your primary and backup ISP).
#
# Run:  ./scripts/junior-nic-watch.sh
# Env:  INTERVAL (default 5s), HEARTBEAT (default 120s)
# =============================================================================
set -uo pipefail

HOST="${HOST:-10.10.0.2}"
KEY="${KEY:-$HOME/.ssh/id_ed25519_cbrouter}"
INTERVAL="${INTERVAL:-5}"
HEARTBEAT="${HEARTBEAT:-120}"

SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=6
     -o IdentitiesOnly=yes -i "$KEY" "root@${HOST}")

ts() { date '+%H:%M:%S'; }

# name|mac|driver|operstate for every non-virtual interface
snapshot() {
  timeout 15 "${SSH[@]}" '
    for i in /sys/class/net/*; do
      n=$(basename "$i")
      case "$n" in lo|wg0) continue ;; esac
      mac=$(cat "$i/address" 2>/dev/null)
      drv=$(basename "$(readlink -f "$i/device/driver" 2>/dev/null)" 2>/dev/null)
      op=$(cat "$i/operstate" 2>/dev/null)
      echo "$n|$mac|${drv:-?}|$op"
    done
  ' 2>/dev/null
}

prev="$(snapshot)"
started=$(date +%s); last_beat=$started

echo "[$(ts)] watching $HOST for new interfaces — baseline:"
printf '%s\n' "$prev" | while IFS='|' read -r n m d o; do
  [[ -n "$n" ]] && printf '    %-8s %s  driver=%s  %s\n' "$n" "$m" "$d" "$o"
done

while true; do
  sleep "$INTERVAL"
  now=$(date +%s)
  cur="$(snapshot)"
  [[ -z "$cur" ]] && continue   # transient ssh blip, don't report churn

  if [[ "$cur" != "$prev" ]]; then
    # appeared
    while IFS='|' read -r n m d o; do
      [[ -z "$n" ]] && continue
      if ! printf '%s\n' "$prev" | grep -q "^${n}|"; then
        echo "[$(ts)] 🔌 NEW INTERFACE: $n  mac=$m  driver=$d  link=$o"
      fi
    done <<< "$cur"

    # link state changed on something we already knew about
    while IFS='|' read -r n m d o; do
      [[ -z "$n" ]] && continue
      old=$(printf '%s\n' "$prev" | grep "^${n}|" | cut -d'|' -f4)
      if [[ -n "$old" && "$old" != "$o" ]]; then
        echo "[$(ts)]    $n link: $old → $o"
      fi
    done <<< "$cur"

    # vanished
    while IFS='|' read -r n m d o; do
      [[ -z "$n" ]] && continue
      if ! printf '%s\n' "$cur" | grep -q "^${n}|"; then
        echo "[$(ts)] ⚠️  interface went away: $n ($m)"
      fi
    done <<< "$prev"

    prev="$cur"
    last_beat=$now
  fi

  if [[ $(( now - last_beat )) -ge $HEARTBEAT ]]; then
    last_beat=$now
    echo "[$(ts)] …watching ($(( (now - started) / 60 ))m) — no change"
  fi
done
