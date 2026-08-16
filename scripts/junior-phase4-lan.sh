#!/usr/bin/env bash
# =============================================================================
# TEMPORARY — Phase 4: turn the Pi into the LAN router.
#
# ⚠️  DO NOT RUN THIS UNTIL ALL THREE ARE TRUE:
#       1. A cable runs from the Xfinity gear to a USB adapter, and that
#          adapter is configured as the WAN (Phase 2/3).
#       2. The Pi has internet THROUGH THAT ADAPTER — verified, not assumed.
#       3. eth0 is UNPLUGGED from the switch.
#
#     Running this while eth0 is still attached to the live switch starts a
#     SECOND DHCP server on Armando's network. Devices would take leases from
#     whichever answered first, half of them pointing at the wrong gateway,
#     failing intermittently. That is the single worst thing we could do here.
#
# THE ADDRESSING (Armando's call, 2026-08-15)
#   The LAN stays 10.0.0.0/24 and the Pi TAKES OVER 10.0.0.1 from the Xfinity
#   box. Deliberate: ~64 devices keep their subnet, and anything with a
#   hand-set static keeps working because its gateway address is unchanged.
#   The cost is that the bridged modem's own admin page (also 10.0.0.1) becomes
#   unreachable — to use it, plug a laptop directly into the modem.
#
#     10.0.0.1          the Pi
#     10.0.0.2 - .19    RESERVED for infrastructure, never handed out
#     10.0.0.20 - .250  the DHCP pool
#
#   19 reserved addresses total (.1 through .19), Armando's call.
#
# ⚠️  THE CHECK THAT MATTERS: if the WAN interface came up with a 10.0.0.x
#     address instead of a public one, bridge mode did NOT engage and the same
#     subnet would exist on two interfaces. This script REFUSES to run in that
#     case rather than half-breaking the router.
#
# Run:  ./scripts/junior-phase4-lan.sh            (add --dry-run to preview)
# =============================================================================
set -uo pipefail

HOST="${HOST:-10.10.0.2}"
KEY="${KEY:-$HOME/.ssh/id_ed25519_cbrouter}"
LAN_IF="${LAN_IF:-eth0}"
WAN_IF="${WAN_IF:-eth1}"
LAN_IP="${LAN_IP:-10.0.0.1}"
LAN_MASK="${LAN_MASK:-255.255.255.0}"
POOL_START="${POOL_START:-20}"     # offset → 10.0.0.20 (Armando: reserve 19)
POOL_LIMIT="${POOL_LIMIT:-231}"    # → up to 10.0.0.250
LEASE="${LEASE:-12h}"
UNIFI_MAC="${UNIFI_MAC:-e0:63:da:59:16:43}"
UNIFI_IP="${UNIFI_IP:-10.0.0.3}"

DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=8
     -o IdentitiesOnly=yes -i "$KEY" "root@${HOST}")

say()  { printf '\n\033[1;36m══ %s\033[0m\n' "$*"; }
step() { printf '\033[1;34m ▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
bad()  { printf '\033[1;31m  x\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------- preflight --
say "PREFLIGHT — refusing to proceed on assumptions"

if ! timeout 20 "${SSH[@]}" true 2>/dev/null; then
  bad "cannot reach the Pi at $HOST over the tunnel"
  exit 1
fi
ok "Pi reachable"

# Pipe-delimited, NOT space-delimited: an empty field (a WAN with no address is
# exactly the case we need to detect) collapses under word-splitting and
# silently shifts every value one place left.
IFS='|' read -r WAN_ADDR WAN_STATE LAN_CARRIER DEFROUTE <<<"$(timeout 25 "${SSH[@]}" "
  printf '%s|%s|%s|%s' \
    \"\$(ip -4 -br addr show $WAN_IF 2>/dev/null | awk '{print \$3}' | cut -d/ -f1)\" \
    \"\$(cat /sys/class/net/$WAN_IF/operstate 2>/dev/null)\" \
    \"\$(cat /sys/class/net/$LAN_IF/carrier 2>/dev/null)\" \
    \"\$(ip route | awk '/^default/{print \$5; exit}')\"
" 2>/dev/null)"

printf '    %-22s %s\n' "$WAN_IF address:" "${WAN_ADDR:-none}"
printf '    %-22s %s\n' "$WAN_IF link:"    "${WAN_STATE:-?}"
printf '    %-22s %s\n' "$LAN_IF carrier:" "${LAN_CARRIER:-?}  (1 = still plugged in)"
printf '    %-22s %s\n' "default route via:" "${DEFROUTE:-none}"

# 1. The WAN must actually be carrying us.
if [[ -z "$WAN_ADDR" ]]; then
  bad "$WAN_IF has no address — the WAN is not up. Do Phase 2/3 first."
  exit 1
fi
if [[ "$DEFROUTE" != "$WAN_IF" ]]; then
  bad "the default route is via '${DEFROUTE:-nothing}', not $WAN_IF."
  echo "    We would be cutting the branch we are sitting on. Stopping."
  exit 1
fi
ok "internet is arriving on $WAN_IF"

# 2. THE BIG ONE: bridge mode must have actually engaged.
case "$WAN_ADDR" in
  10.0.0.*)
    bad "$WAN_IF has $WAN_ADDR — that is the SAME SUBNET as the planned LAN."
    echo "    Bridge mode did not engage; the modem is still handing out"
    echo "    10.0.0.x. Proceeding would put one subnet on two interfaces and"
    echo "    break routing in ways that look random."
    echo "    Fix bridge mode, or re-run with LAN_IP=10.0.10.1 to move the LAN."
    exit 1
    ;;
  10.*|192.168.*|172.1[6-9].*|172.2[0-9].*|172.3[01].*)
    echo "    ⚠️  $WAN_ADDR is a PRIVATE address — you are behind another NAT."
    echo "        Workable, but inbound connections will not reach you."
    ;;
  *)
    ok "$WAN_ADDR looks public — bridge mode engaged"
    ;;
esac

# 3. eth0 must be unplugged, or we start a competing DHCP server.
if [[ "$LAN_CARRIER" == "1" ]]; then
  bad "$LAN_IF still has a cable in it."
  echo "    If that cable goes to the live switch, this script would start a"
  echo "    SECOND DHCP server on the network. Unplug $LAN_IF, run this, then"
  echo "    plug the switch in afterwards."
  echo "    (If it is already plugged into the switch AND the Xfinity DHCP is"
  echo "     gone, re-run with ALLOW_CARRIER=1.)"
  [[ "${ALLOW_CARRIER:-0}" != "1" ]] && exit 1
  echo "    ALLOW_CARRIER=1 set — continuing anyway."
fi
ok "preflight passed"

if [[ $DRY -eq 1 ]]; then
  say "DRY RUN — nothing was changed"
  cat <<EOF
    Would configure:
      $LAN_IF  -> LAN, static $LAN_IP/$LAN_MASK, firewall zone 'lan'
      DHCP     -> pool 10.0.0.$POOL_START .. 10.0.0.$((POOL_START + POOL_LIMIT - 1)), lease $LEASE
      reserved -> 10.0.0.2 .. 10.0.0.$((POOL_START - 1)) never handed out
      static   -> $UNIFI_MAC => $UNIFI_IP  (UniFi controller)
EOF
  exit 0
fi

# ------------------------------------------------------------------- apply --
say "CONFIGURING $LAN_IF AS THE LAN"
timeout 90 "${SSH[@]}" \
  LAN_IF="$LAN_IF" LAN_IP="$LAN_IP" LAN_MASK="$LAN_MASK" \
  POOL_START="$POOL_START" POOL_LIMIT="$POOL_LIMIT" LEASE="$LEASE" \
  UNIFI_MAC="$UNIFI_MAC" UNIFI_IP="$UNIFI_IP" 'sh -s' <<'REMOTE' 2>&1 | sed 's/^/    /'
set -e

# --- the LAN interface ------------------------------------------------------
uci set network.lan=interface
uci set network.lan.device="$LAN_IF"
uci set network.lan.proto='static'
uci set network.lan.ipaddr="$LAN_IP"
uci set network.lan.netmask="$LAN_MASK"

# eth0 was the WAN. Remove that role or netifd will fight itself over the
# same device.
uci -q delete network.wan  2>/dev/null || true
uci -q delete network.wan6 2>/dev/null || true
uci commit network

# --- DHCP -------------------------------------------------------------------
# start is an OFFSET from the network base, not an address: 21 -> 10.0.0.21.
uci set dhcp.lan=dhcp
uci set dhcp.lan.interface='lan'
uci set dhcp.lan.start="$POOL_START"
uci set dhcp.lan.limit="$POOL_LIMIT"
uci set dhcp.lan.leasetime="$LEASE"
uci -q delete dhcp.lan.ignore 2>/dev/null || true

# The old wan dhcp stanza is meaningless now.
uci -q delete dhcp.wan 2>/dev/null || true

# --- reservations -----------------------------------------------------------
# The UniFi controller keeps 10.0.0.3 so twelve APs never lose their inform
# target. Idempotent: drop any previous entry for this MAC first.
for h in $(uci show dhcp | sed -n "s/^dhcp\.@host\[\([0-9]*\)\]\.mac='$UNIFI_MAC'/\1/p" | sort -rn); do
  uci delete dhcp.@host[$h]
done
h=$(uci add dhcp host)
uci set dhcp.$h.name='unifi-controller'
uci set dhcp.$h.mac="$UNIFI_MAC"
uci set dhcp.$h.ip="$UNIFI_IP"
uci commit dhcp

# --- firewall ---------------------------------------------------------------
# Put the new lan network into the lan zone (input ACCEPT) and make sure it is
# allowed to forward out to wan.
zone=$(uci show firewall | sed -n "s/^firewall\.@zone\[\([0-9]*\)\]\.name='lan'/\1/p" | head -1)
if [ -n "$zone" ]; then
  uci -q del_list firewall.@zone[$zone].network='lan' 2>/dev/null || true
  uci add_list firewall.@zone[$zone].network='lan'
fi
uci commit firewall

/etc/init.d/network reload  >/dev/null 2>&1
sleep 4
/etc/init.d/dnsmasq restart >/dev/null 2>&1
/etc/init.d/firewall reload >/dev/null 2>&1
sleep 3

echo "lan address : $(ip -4 -br addr show $LAN_IF | awk '{print $3}')"
echo "dhcp pool   : .$POOL_START for $POOL_LIMIT addresses, lease $LEASE"
echo "reservation : $(uci get dhcp.@host[-1].name) -> $(uci get dhcp.@host[-1].ip)"
echo "dnsmasq     : $(pgrep -c dnsmasq) process(es)"
REMOTE

if [[ $? -ne 0 ]]; then bad "configuration step failed — check the output above"; exit 1; fi
ok "LAN configured"

# ------------------------------------------------------------------ verify --
say "VERIFY"
timeout 40 "${SSH[@]}" '
echo "--- addresses ---";      ip -4 -br addr | grep -v "^lo"
echo "--- default route ---";  ip route | grep "^default"
echo "--- dhcp listening ---"; netstat -lun 2>/dev/null | grep ":67 " || echo "(no :67 — DHCP NOT listening!)"
echo "--- internet from the Pi ---"; ping -c1 -W3 1.1.1.1 >/dev/null 2>&1 && echo OK || echo DOWN
' 2>&1 | sed 's/^/    /'

cat <<EOF

────────────────────────────────────────────────────────────
  NOW plug the switch into the Pi's ${LAN_IF}.

  Then on any device: renew its lease (toggle Wi-Fi, or
  unplug/replug) and confirm it gets 10.0.0.21 or higher
  with gateway ${LAN_IP}.

  Watch leases arrive:
      ssh root@${HOST} 'cat /tmp/dhcp.leases'

  The UniFi APs may take a few minutes to find the controller
  again. If they do not, check the controller actually came up
  on ${UNIFI_IP}.
────────────────────────────────────────────────────────────
EOF
