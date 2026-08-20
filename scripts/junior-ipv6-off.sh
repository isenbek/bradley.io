#!/usr/bin/env bash
# Turn IPv6 OFF at the LAN, so ALL household traffic uses IPv4 over the fiber
# and the mwan3 failover covers 100% of it.
#
# WHY THIS IS NEEDED: IPv4 exits via AT&T, but IPv6 was still exiting via
# Comcast (wan6 rides wan2). Dual-stack sites are preferred over IPv6 by
# clients, so a large share of traffic was still on the demoted line - and
# outside the failover entirely.
#
# THE KEY LINE IS filter_aaaa. Disabling RA only stops NEW advertisements;
# devices keep their existing IPv6 addresses until the lifetimes expire, which
# can be hours. Making the resolver stop returning AAAA records is what makes
# the change take effect NOW.
#
# wan6 is deliberately LEFT INTACT - the router keeps its own IPv6 upstream, so
# re-enabling for the LAN later (or moving it to AT&T) is a two-line change.
#
# REVERSE:
#   uci set dhcp.lan.ra='server'; uci set dhcp.lan.dhcpv6='server'
#   uci set dhcp.lan.ndp='relay'  # only if it was relay before; check first
#   uci set network.lan.ip6assign='60'
#   uci -q delete dhcp.@dnsmasq[0].filter_aaaa
#   uci commit && /etc/init.d/network reload && /etc/init.d/odhcpd restart
#   /etc/init.d/dnsmasq restart

set -euo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$PI")

echo "== BEFORE (recording, so this is reversible) =="
timeout 25 "${SSH[@]}" '
  echo "-- dhcp.lan v6 settings"; uci show dhcp.lan | grep -E "ra|dhcpv6|ndp" || echo "  (none set)"
  echo "-- ip6assign"; uci get network.lan.ip6assign 2>/dev/null || echo "  (unset)"
  echo "-- filter_aaaa"; uci get dhcp.@dnsmasq[0].filter_aaaa 2>/dev/null || echo "  (unset)"
  echo "-- LAN v6 addresses currently advertised"; ip -6 addr show eth0 | grep "inet6.*global" || true
'

echo
echo "== applying =="
timeout 60 "${SSH[@]}" '
  set -e
  uci set dhcp.lan.ra="disabled"
  uci set dhcp.lan.dhcpv6="disabled"
  uci set dhcp.lan.ndp="disabled"
  uci -q delete network.lan.ip6assign || true
  uci set dhcp.@dnsmasq[0].filter_aaaa="1"      # the line that makes it immediate
  uci commit dhcp
  uci commit network
  /etc/init.d/network reload
  /etc/init.d/odhcpd restart
  /etc/init.d/dnsmasq restart
'
sleep 12

echo
echo "== AFTER =="
timeout 45 "${SSH[@]}" '
  echo "-- resolver must no longer return AAAA:"
  nslookup google.com 127.0.0.1 2>&1 | grep -iE "address|name" | head -6
  echo
  echo "-- IPv4 still exits via ATT?"
  printf "   "; wget -q -T 12 -O - -4 https://ifconfig.me/ip 2>/dev/null; echo
  echo
  echo "-- router keeps its own v6 upstream (for easy re-enable later):"
  ip -6 route | grep -m1 default || echo "   none"
  echo
  echo "-- LAN health"
  echo -n "   leases: "; wc -l < /tmp/dhcp.leases
  ip -4 addr show eth0 | grep "inet 10"
  echo -n "   nextdns: "; /etc/init.d/nextdns status
  echo -n "   mwan3: "; mwan3 status 2>/dev/null | grep -c "is online"
  echo "-- filtering still working:"
  nslookup doubleclick.net 127.0.0.1 2>&1 | tail -2
'
