#!/usr/bin/env bash
# Set up mwan3 failover: AT&T Fiber primary, Xfinity backup.
#
# TWO separate notions of "primary" have to agree, or the router and the house
# take different paths:
#   * netifd metric  -> decides where the ROUTER's own traffic goes (main table)
#   * mwan3 member   -> decides where FORWARDED (household) traffic goes
# This sets both.
#
# Tracking IPs are deliberately NOT the ISP gateway - that stays reachable even
# when the ISP's upstream is broken, which is exactly the outage that matters.
#
# Reverse:  /etc/init.d/mwan3 stop && /etc/init.d/mwan3 disable
#           uci set network.wan1.metric=40; uci set network.wan2.metric=30
#           uci commit network && /etc/init.d/network reload

set -euo pipefail
PI="${PI:-10.10.0.2}"
SSH=(ssh -i "$HOME/.ssh/id_ed25519_cbrouter" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$PI")

echo "== preflight =="
timeout 25 "${SSH[@]}" '
  set -e
  ip -4 addr show wan1 | grep -q "inet " || { echo "REFUSE: wan1 has no address"; exit 1; }
  ip -4 addr show wan2 | grep -q "inet " || { echo "REFUSE: wan2 has no address"; exit 1; }
  a1=$(ip -4 -o addr show wan1 | awk "{print \$4}" | cut -d/ -f1)
  case "$a1" in 192.168.*|10.*|172.1[6-9].*|172.2[0-9].*|172.3[01].*)
     echo "REFUSE: wan1 is $a1 - IP Passthrough is not active"; exit 1;; esac
  which mwan3 >/dev/null 2>&1 || { echo "REFUSE: mwan3 not installed"; exit 1; }
  echo "ok: wan1=$a1 (public), wan2 up, mwan3 present"
'

echo "== writing mwan3 config =="
timeout 60 "${SSH[@]}" 'cat > /etc/config/mwan3 <<CFG
config globals "globals"
	option mmx_mask "0x3F00"
	option enabled "1"

config interface "wan1"
	option enabled "1"
	option family "ipv4"
	list track_ip "1.1.1.1"
	list track_ip "8.8.8.8"
	list track_ip "9.9.9.9"
	option reliability "1"
	option count "1"
	option timeout "2"
	option interval "5"
	option down "3"
	option up "5"
	option initial_state "online"

config interface "wan2"
	option enabled "1"
	option family "ipv4"
	list track_ip "1.1.1.1"
	list track_ip "8.8.8.8"
	list track_ip "9.9.9.9"
	option reliability "1"
	option count "1"
	option timeout "2"
	option interval "5"
	option down "3"
	option up "5"
	option initial_state "online"

config member "wan1_prim"
	option interface "wan1"
	option metric "1"
	option weight "3"

config member "wan2_back"
	option interface "wan2"
	option metric "2"
	option weight "2"

config policy "failover"
	list use_member "wan1_prim"
	list use_member "wan2_back"
	option last_resort "unreachable"

config rule "default_v4"
	option dest_ip "0.0.0.0/0"
	option family "ipv4"
	option proto "all"
	option use_policy "failover"
	option sticky "0"
CFG
uci commit mwan3'

echo "== flipping netifd metrics so ROUTER traffic agrees with the house =="
timeout 60 "${SSH[@]}" '
  set -e
  uci set network.wan1.metric="10"   # ATT primary
  uci set network.wan2.metric="20"   # Xfinity backup
  uci commit network
  /etc/init.d/network reload
'
sleep 10

echo "== starting mwan3 =="
timeout 60 "${SSH[@]}" '
  /etc/init.d/mwan3 enable
  /etc/init.d/mwan3 restart
'
sleep 15

echo "== status =="
timeout 45 "${SSH[@]}" '
  mwan3 status 2>&1 | head -30
  echo "-- main-table default"; ip route | grep "^default"
  echo "-- house can still resolve + reach"; ping -c 2 -W 3 1.1.1.1 2>&1 | tail -2
'
