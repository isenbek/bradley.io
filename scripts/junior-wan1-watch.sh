#!/usr/bin/env bash
# Wait for a cable on wan1, then bring it up and report what AT&T handed us.
#
# Safe to run unattended: wan1 is metric 40 (Xfinity is 30, so it cannot steal
# the default route) and peerdns=0 (its resolvers cannot enter dnsmasq).
# Before IP Passthrough is configured we expect a PRIVATE 192.168.1.x lease -
# that is the success case here, not a failure. Its only job is to make the Pi
# appear in the BGW320's device list so the passthrough MAC dropdown is easy.

set -uo pipefail
PI="${PI:-10.10.0.2}"
DEADLINE=$(( $(date +%s) + 2400 ))   # 40 minutes
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$PI")

# NOTE (learned the hard way): an interface with disabled='1' is left
# ADMINISTRATIVELY DOWN by netifd, and a down netdev never powers its PHY - so
# /sys/class/net/wan1/carrier is unreadable and can NEVER read 1, no matter
# what is plugged in. Polling carrier while the interface is disabled waits
# forever on a signal that cannot arrive. Force the device up first; that
# senses link without starting DHCP.
echo "forcing wan1 admin-up so link can be sensed (no DHCP yet)..."
timeout 15 "${SSH[@]}" 'ip link set wan1 up' 2>/dev/null || true

echo "waiting for carrier on wan1..."
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
    c=$(timeout 15 "${SSH[@]}" 'cat /sys/class/net/wan1/carrier 2>/dev/null || echo 0' 2>/dev/null | tr -d '[:space:]')
    if [ "$c" = "1" ]; then
        echo "LINK UP at $(date '+%H:%M:%S')"
        break
    fi
    sleep 20
done

if [ "${c:-0}" != "1" ]; then
    echo "no cable within the window - wan1 still dark, nothing changed"
    exit 0
fi

echo "== link details =="
timeout 25 "${SSH[@]}" 'echo -n "  negotiated: "; cat /sys/class/net/wan1/speed; echo " Mbps"'

echo "== bringing wan1 up (metric 40, peerdns off - cannot disturb Xfinity) =="
timeout 60 "${SSH[@]}" '
  uci -q delete network.wan1.disabled
  uci commit network
  /etc/init.d/network reload
'
sleep 12

echo "== what did AT&T give us? =="
timeout 40 "${SSH[@]}" '
  echo "-- wan1"; ubus call network.interface.wan1 status 2>/dev/null | grep -E "\"up\"|\"address\"|\"mask\"|\"nexthop\"" | head -6
  echo "-- routes"; ip route | grep -E "^default|wan1" | head
  echo "-- SANITY: Xfinity must still be the default route"
  ip route | grep -q "^default .* dev wan2" && echo "   OK - wan2 still primary" || echo "   *** WAN2 LOST PRIMARY - investigate ***"
  echo "-- SANITY: dns upstreams must still be Comcast only"
  cat /tmp/resolv.conf.d/resolv.conf.auto
'
