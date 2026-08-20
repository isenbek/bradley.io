#!/usr/bin/env bash
# Simulate the REAL common outage: link stays up, ISP is dead.
#
# We drop the router's traffic to mwan3's three tracking IPs when it leaves via
# wan1. mwan3 then sees "interface up, nothing reachable" - exactly the case a
# carrier-loss test cannot produce, and the one that actually happens when an
# ISP breaks upstream while the modem keeps its light on.
#
# BLAST RADIUS: only router-originated packets to 1.1.1.1/8.8.8.8/9.9.9.9 that
# egress wan1. Household forwarded traffic is untouched.
#
# DEAD-MAN SWITCH: the Pi removes the rule by itself after 6 minutes even if
# this script dies, the tunnel drops, or the laptop closes. Never leave a
# router in a deliberately broken state that depends on you coming back.

set -uo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$PI")

cleanup() {
    echo
    echo "== removing blackhole =="
    timeout 30 "${SSH[@]}" '
      h=$(nft -a list chain inet fw4 output 2>/dev/null | grep "JUNIORTEST" | grep -o "handle [0-9]*" | awk "{print \$2}")
      [ -n "$h" ] && nft delete rule inet fw4 output handle $h && echo "  rule removed" || echo "  no rule present"
    ' 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "== baseline =="
timeout 25 "${SSH[@]}" 'mwan3 status 2>/dev/null | grep -E "^ interface"; ip route | grep -m1 "^default"'

echo
echo "== installing blackhole + 6-minute dead-man switch =="
timeout 30 "${SSH[@]}" '
  nft insert rule inet fw4 output oifname "wan1" ip daddr { 1.1.1.1, 8.8.8.8, 9.9.9.9 } counter drop comment "JUNIORTEST"
  # dead-man: remove it regardless of what happens to the controlling session
  ( sleep 360
    h=$(nft -a list chain inet fw4 output 2>/dev/null | grep JUNIORTEST | grep -o "handle [0-9]*" | awk "{print \$2}")
    [ -n "$h" ] && nft delete rule inet fw4 output handle $h
  ) >/dev/null 2>&1 &
  echo "  installed"
'

echo
echo "== watching for failover (tracking should fail in ~15s) =="
prev=""
for i in $(seq 1 45); do
    now=$(timeout 10 "${SSH[@]}" '
      w1=$(mwan3 status 2>/dev/null | grep -c "interface wan1 is online")
      pol=$(mwan3 status 2>/dev/null | sed -n "/Current ipv4 policies/,/^$/p" | grep -E "wan[12]" | tr -d " " | tr "\n" ",")
      rt=$(ip route | grep -m1 "^default" | awk "{print \$5}")
      car=$(cat /sys/class/net/wan1/carrier)
      echo "wan1_online=$w1 carrier=$car policy=$pol route=$rt"
    ' 2>/dev/null)
    if [ "$now" != "$prev" ]; then echo "  $(date '+%H:%M:%S')  $now"; prev="$now"; fi
    case "$now" in *"policy=wan2(100%)"*) echo "  -> FAILED OVER while link stayed up"; break;; esac
    sleep 2
done

echo
echo "== proving the house still works on Xfinity =="
timeout 30 "${SSH[@]}" '
  printf "  public IP: "; wget -q -T 12 -O - -4 https://ifconfig.me/ip 2>/dev/null; echo
  echo -n "  carrier on wan1 (should still be 1 - link never dropped): "; cat /sys/class/net/wan1/carrier
'
