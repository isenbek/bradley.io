#!/usr/bin/env bash
# Watch for AT&T (wan1) to come back after the 2026-08-21 00:20 outage.
# Reports every state change, and confirms mwan3 moves traffic back on its own.
set -uo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=8 "root@$PI")
DEADLINE=$(( $(date +%s) + 3300 ))   # 55 min

prev=""
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
    now=$(timeout 15 "${SSH[@]}" '
        on=$(mwan3 status 2>/dev/null | grep -c "interface wan1 is online")
        car=$(cat /sys/class/net/wan1/carrier 2>/dev/null || echo -)
        addr=$(ip -4 -o addr show wan1 2>/dev/null | awk "{print \$4}")
        gw=$(ping -c 1 -W 2 -I wan1 99.150.196.1 >/dev/null 2>&1 && echo up || echo down)
        rt=$(ip route | grep -m1 "^default" | awk "{print \$5}")
        echo "wan1_online=$on carrier=$car addr=$addr att_gw=$gw active=$rt"
    ' 2>/dev/null)
    [ -z "$now" ] && now="(pi unreachable)"
    if [ "$now" != "$prev" ]; then
        echo "$(date '+%H:%M:%S')  $now"
        prev="$now"
    fi
    case "$now" in
      *"wan1_online=1"*)
        echo
        echo "=== AT&T IS BACK - checking mwan3 moved traffic on its own ==="
        timeout 40 "${SSH[@]}" '
          sleep 15
          mwan3 status 2>/dev/null | grep -E "^ interface"
          mwan3 status 2>/dev/null | sed -n "/Current ipv4 policies/,/^$/p"
          printf "public IP: "; wget -q -T 10 -O - -4 https://ifconfig.me/ip 2>/dev/null; echo
          echo "-- outage record:"; tail -3 /root/wan/events.log
        '
        exit 0 ;;
    esac
    sleep 30
done
echo "still down after the watch window"
