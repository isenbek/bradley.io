#!/usr/bin/env bash
# Enable software flow offloading on the Pi.
#
# WHY: without it the CPU runs the full netfilter path for every packet of
# every flow. With it, once a connection is established, fw4 hands it to a
# kernel flowtable fast path. On a Pi 5 this is the difference between leaving
# throughput on the table and getting close to gigabit line rate.
#
# HARDWARE offload is deliberately NOT enabled - the Pi 5 has no NAT
# offload engine, so flow_offloading_hw would just fail over to software
# anyway while making the config lie about what it is doing.
#
# INTERACTION TO WATCH: offloaded flows skip the path where mwan3 applies its
# routing marks. The FIRST packet of every connection is still fully evaluated,
# so failover and banIP still work - but this is being enabled now, with a
# single WAN, precisely so that any problem is attributable before mwan3 is
# added on top.
#
# Reverse:  uci set firewall.@defaults[0].flow_offloading='0'
#           uci commit firewall && /etc/init.d/firewall restart

set -euo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$PI")

echo "== before =="
timeout 25 "${SSH[@]}" '
  echo -n "flow_offloading: "; uci get firewall.@defaults[0].flow_offloading 2>/dev/null || echo "(unset)"
  echo -n "flowtable present: "; nft list ruleset 2>/dev/null | grep -c "flowtable" || true
  echo "-- default route"; ip route | grep "^default"
'

echo "== applying =="
timeout 60 "${SSH[@]}" '
  set -e
  uci set firewall.@defaults[0].flow_offloading="1"
  uci -q delete firewall.@defaults[0].flow_offloading_hw || true   # Pi 5 has no HW engine; delete returns 1 if absent
  uci commit firewall
  /etc/init.d/firewall restart >/dev/null 2>&1
'
sleep 8

echo "== after =="
timeout 40 "${SSH[@]}" '
  echo -n "flow_offloading: "; uci get firewall.@defaults[0].flow_offloading
  echo "-- flowtable in ruleset:"; nft list ruleset 2>/dev/null | grep -i "flowtable\|flow add" | head -5
  echo "-- default route"; ip route | grep "^default"
  echo "-- lan"; ip -4 addr show eth0 | grep "inet 10"
  echo "-- router still has outbound"; wget -q -T 8 -O /dev/null https://downloads.openwrt.org/ && echo "   OK" || echo "   FAILED"
  echo "-- dns still filtered (nextdns)"; /etc/init.d/nextdns status
  echo "-- banip still loaded"; nft list ruleset 2>/dev/null | grep -c "banIP" || echo 0
'
