#!/usr/bin/env bash
# Turn IPv6 off at the LAN the RIGHT way: deprecate first, then go silent.
#
# The mistake the first time was going straight to ra='disabled'. That only
# stops NEW advertisements - every device keeps the IPv6 address and default
# route it already holds until the lifetimes expire, which can take hours. In
# the meantime they still TRY IPv6, and it leads nowhere.
#
# The fix is to keep RA running just long enough to say "this prefix is dead
# and I am no longer your router" - RFC 4861 router lifetime 0 plus a prefix
# advertised at zero lifetime. Hosts drop both immediately. THEN go silent.
#
# REVERSE:
#   uci set dhcp.lan.ra='server'; uci set dhcp.lan.dhcpv6='server'
#   uci -q delete dhcp.lan.ra_lifetime; uci -q delete dhcp.lan.ndp
#   uci set network.lan.ip6assign='64'
#   uci -q delete dhcp.@dnsmasq[0].filter_aaaa
#   uci commit dhcp; uci commit network
#   /etc/init.d/network reload; /etc/init.d/odhcpd restart; /etc/init.d/dnsmasq restart

set -uo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$PI")

echo "== PHASE 1: tell every device to let go of IPv6 =="
timeout 60 "${SSH[@]}" '
  set -e
  uci set dhcp.lan.ra="server"          # keep RA RUNNING - that is the point
  uci set dhcp.lan.ra_lifetime="0"      # router lifetime 0 = "I am not your default router"
  uci -q delete network.lan.ip6assign || true   # prefix goes -> odhcpd advertises it at lifetime 0
  uci set dhcp.@dnsmasq[0].filter_aaaa="1"      # stop handing out AAAA immediately
  uci commit dhcp
  uci commit network
  /etc/init.d/network reload
  /etc/init.d/odhcpd restart
  /etc/init.d/dnsmasq restart
'
echo "  deprecation RAs going out. waiting 90s for devices to act on them..."
sleep 90

echo
echo "== PHASE 2: now go silent =="
timeout 60 "${SSH[@]}" '
  set -e
  uci set dhcp.lan.ra="disabled"
  uci set dhcp.lan.dhcpv6="disabled"
  uci set dhcp.lan.ndp="disabled"
  uci -q delete dhcp.lan.ra_lifetime || true
  uci commit dhcp
  /etc/init.d/odhcpd restart
'
sleep 10

echo
echo "== VERIFY =="
timeout 45 "${SSH[@]}" '
  echo "-- LAN v6 prefix (should be link-local / ULA only, no delegated global):"
  ip -6 addr show eth0 | grep "inet6" | sed "s/^/   /"
  echo "-- AAAA filtering (only SafeSearch records should survive):"
  for h in www.netflix.com www.amazon.com www.apple.com; do
    printf "   %-20s AAAA answers: " "$h"
    nslookup -query=AAAA $h 127.0.0.1 2>/dev/null | grep -c "^Address: .*:" || echo 0
  done
  echo "-- IPv4 still exits via ATT:"
  printf "   "; wget -q -T 12 -O - -4 https://ifconfig.me/ip 2>/dev/null; echo
  echo "-- health:"
  echo -n "   leases: "; wc -l < /tmp/dhcp.leases
  echo -n "   mwan3 online: "; mwan3 status 2>/dev/null | grep -c "is online"
  echo -n "   nextdns: "; /etc/init.d/nextdns status
  echo -n "   banip both wans: "; nft list table inet banIP 2>/dev/null | grep -m1 -o "iifname != { \"wan1\", \"wan2\" }"
  echo -n "   adblock: "; nslookup doubleclick.net 127.0.0.1 2>&1 | grep -q NXDOMAIN && echo "blocking" || echo "NOT BLOCKING"
'
