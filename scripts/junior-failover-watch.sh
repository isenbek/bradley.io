#!/usr/bin/env bash
# Watch a real failover happen and record it with timestamps.
# Polls mwan3 + the main-table default route once a second and prints only
# on change, so the log reads as a timeline rather than a wall of noise.
set -uo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=8 -o ServerAliveInterval=5 "root@$PI")
DEADLINE=$(( $(date +%s) + 2700 ))   # 45 min

prev=""
echo "watching. pull the AT&T cable whenever you like."
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
    now=$(timeout 12 "${SSH[@]}" '
        st=$(mwan3 status 2>/dev/null | grep -E "^ interface (wan1|wan2) is" | sed "s/ is .*tracking.*//;s/^ interface //" | tr "\n" " ")
        w1=$(mwan3 status 2>/dev/null | grep -c "interface wan1 is online")
        w2=$(mwan3 status 2>/dev/null | grep -c "interface wan2 is online")
        pol=$(mwan3 status 2>/dev/null | sed -n "/Current ipv4 policies/,/^$/p" | grep -E "wan[12]" | tr -d " " | tr "\n" ",")
        rt=$(ip route | grep -m1 "^default" | awk "{print \$3, \$5}")
        car1=$(cat /sys/class/net/wan1/carrier 2>/dev/null || echo 0)
        echo "wan1_online=$w1 wan2_online=$w2 carrier1=$car1 policy=$pol route=$rt"
    ' 2>/dev/null)
    [ -z "$now" ] && now="(unreachable)"
    if [ "$now" != "$prev" ]; then
        echo "$(date '+%H:%M:%S')  $now"
        prev="$now"
    fi
    sleep 1
done
echo "watch window ended"
