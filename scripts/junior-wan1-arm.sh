#!/usr/bin/env bash
# Prepare wan1 to receive the AT&T Fiber handoff SAFELY.
#
# Two hazards this closes, both of which fire the instant a cable is plugged in:
#
#   1. ROUTE THEFT. wan1 is configured metric 20, wan2 (Xfinity) metric 30.
#      Lower metric wins, so an untested AT&T line would silently become the
#      whole household's internet the moment it got a DHCP lease. Every open
#      connection breaks as the source address changes.
#
#   2. DNS LEAK. wan1 has no peerdns setting, which defaults to ON. AT&T's
#      resolvers would be appended to dnsmasq's upstream list, so a share of
#      queries would bypass NextDNS + adblock entirely. This is the same class
#      of fault as the DoH bypass we already closed once.
#
# After this runs, plugging the AT&T cable in does NOTHING. Nobody notices.
# We then bring wan1 up deliberately, inspect what AT&T handed us, and only
# then enable mwan3 for real failover.
#
# Reverse:  uci del network.wan1.disabled; uci commit network; /etc/init.d/network reload

set -euo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$PI")

echo "== preflight =="
timeout 25 "${SSH[@]}" '
  set -e
  # Refuse if wan2 is not carrying the default route — we would be working
  # blind on a router that is already unhealthy.
  ip route | grep -q "^default .* dev wan2" || { echo "REFUSE: wan2 is not the default route"; exit 1; }
  # Refuse if wan1 already has a carrier — the cable is in, too late for this.
  [ "$(cat /sys/class/net/wan1/carrier 2>/dev/null || echo 0)" = "0" ] || {
      echo "REFUSE: wan1 already has link. Unplug it, then re-run."; exit 1; }
  echo "ok: wan2 is default route, wan1 has no link"
'

echo "== applying =="
timeout 60 "${SSH[@]}" '
  set -e
  uci set network.wan1.disabled="1"   # inert until we say otherwise
  uci set network.wan1.metric="40"    # ABOVE wan2 (30) - can never steal the route
  uci set network.wan1.peerdns="0"    # ATT resolvers must never reach dnsmasq
  uci commit network
  /etc/init.d/network reload
'
sleep 6

echo "== verify (nothing should have moved) =="
timeout 30 "${SSH[@]}" '
  echo "-- wan1 config"; uci show network.wan1
  echo "-- wan2 up?";    ubus call network.interface.wan2 status | grep -E "\"up\"|\"address\"" | head -3
  echo "-- default route"; ip route | grep "^default"
  echo "-- dns upstreams (Comcast only expected)"; cat /tmp/resolv.conf.d/resolv.conf.auto
  echo "-- lan"; ip -4 addr show eth0 | grep inet
  echo "-- nextdns"; /etc/init.d/nextdns status
'
