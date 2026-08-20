#!/usr/bin/env bash
# Watch for IP Passthrough taking effect: wan1 should stop holding a private
# 192.168.1.x lease and come back with a PUBLIC address.
#
# The BGW320 reboots on save (~2 min), so expect wan1 to drop and return.
set -uo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$PI")
DEADLINE=$(( $(date +%s) + 900 ))   # 15 minutes

prev=""
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
    a=$(timeout 15 "${SSH[@]}" 'ip -4 -o addr show wan1 2>/dev/null | awk "{print \$4}" | cut -d/ -f1' 2>/dev/null | tr -d '[:space:]')
    [ -z "$a" ] && a="(none)"
    if [ "$a" != "$prev" ]; then
        echo "$(date '+%H:%M:%S')  wan1 = $a"
        prev="$a"
    fi
    case "$a" in
        192.168.*|10.*|172.1[6-9].*|172.2*.*|172.3[01].*|"(none)") ;;   # still private / down
        *)
            echo
            echo "=== PUBLIC ADDRESS - passthrough took ==="
            timeout 40 "${SSH[@]}" '
              echo "-- wan1"; ip -4 addr show wan1 | grep inet
              echo "-- routes"; ip route | grep -E "^default"
              echo "-- SANITY: Xfinity must STILL be primary (metric 30 < 40)"
              ip route | grep -q "^default .* dev wan2" && echo "   OK" || echo "   *** wan2 lost primary ***"
              echo "-- SANITY: DNS upstreams (ATT resolvers must be absent)"
              cat /tmp/resolv.conf.d/resolv.conf.auto
              echo "-- can wan1 actually reach the internet?"
              ping -c 3 -W 3 -I wan1 1.1.1.1 2>&1 | tail -2
            '
            exit 0 ;;
    esac
    sleep 15
done
echo "timed out - wan1 never got a public address"
