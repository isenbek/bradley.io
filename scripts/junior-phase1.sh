#!/usr/bin/env bash
# =============================================================================
# TEMPORARY — Phase 1 of Armando's dual-WAN router build.
#
# Everything here is ADDITIVE. Nothing changes how the Pi currently reaches the
# internet, because that path (eth0 -> Xfinity) is also how we reach the Pi.
#
# WHAT IT DOES, in deliberate order:
#   A. Recovery Wi-Fi AP on wlan0        <- a SECOND door, built first
#   B. Pre-seed an INERT /etc/config/mwan3
#   C. opkg update + install mwan3 / banip / adblock (+ LuCI apps)
#   D. Pin eth1/eth2 to their MACs so they cannot swap on reboot
#   E. Leave banip + adblock installed but NOT enabled
#
# WHY B COMES BEFORE C:
#   mwan3's job is rewriting the routing table. Installed with its stock config
#   it can decide our wireguard route is wrong and drop it — killing the tunnel
#   mid-install. opkg NEVER overwrites an existing /etc/config file, so seeding
#   an inert one first means the package installs around it and stays dormant.
#
# The stock wireless config is a landmine and is NOT simply enabled:
#   ssid='OpenWrt' encryption='none' network='lan'  (and 'lan' doesn't exist)
# Enabling that as-is would broadcast an OPEN network. We rewrite it entirely.
#
# Each step re-checks that the Pi is still reachable before continuing.
#
# Run:  ./scripts/junior-phase1.sh
# =============================================================================
set -uo pipefail

HOST="${HOST:-10.10.0.2}"
KEY="${KEY:-$HOME/.ssh/id_ed25519_cbrouter}"
WIFI_SSID="${WIFI_SSID:-pi-rescue}"
WIFI_NET="${WIFI_NET:-192.168.98}"      # recovery wifi subnet, deliberately
                                        # distinct from 10.0.0.x, 10.0.10.x,
                                        # 10.10.0.x and 192.168.99.x
COUNTRY="${COUNTRY:-US}"

SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=8
     -o IdentitiesOnly=yes -i "$KEY" "root@${HOST}")

say()  { printf '\n\033[1;36m══ %s\033[0m\n' "$*"; }
step() { printf '\033[1;34m ▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
bad()  { printf '\033[1;31m  x\033[0m %s\n' "$*"; }

alive() { timeout 15 "${SSH[@]}" true 2>/dev/null; }

guard() {  # abort loudly rather than stack a step on a broken Pi
  if ! alive; then
    bad "LOST THE PI after: $1"
    echo "    Recovery: LuCI/ssh over the tunnel, or plug a laptop into eth0"
    echo "    at 192.168.99.2/24 and ssh root@192.168.99.1"
    exit 1
  fi
}

# --- generate the wifi passphrase (delegated password authority) -------------
gen_pw() {
  local d
  for f in /usr/share/dict/words /usr/share/dict/american-english; do
    [[ -r "$f" ]] && d="$f" && break
  done
  if [[ -n "${d:-}" ]]; then
    printf '%s-%02d\n' \
      "$(grep -x '[a-z]\{4,7\}' "$d" | shuf --random-source=/dev/urandom -n3 | paste -sd- -)" \
      "$(( RANDOM % 100 ))"
  else
    openssl rand -base64 15 | tr -d '/+='
  fi
}
WIFI_PW="$(gen_pw)"

say "PRECHECK"
if ! alive; then bad "cannot reach $HOST — is wg-pi5 up?"; exit 1; fi
ok "Pi reachable over the tunnel"
timeout 15 "${SSH[@]}" 'echo "    uptime:$(uptime | sed "s/.*up //;s/,.*load/ load/")"' 2>/dev/null

# =============================================================================
say "A. RECOVERY WI-FI  (the second door)"
# 2.4GHz on purpose: this radio exists so you can reach the Pi from another
# room when everything else is broken. Range and wall penetration beat speed,
# and 2.4GHz sidesteps DFS radar channels entirely.
step "configuring radio0: country=$COUNTRY band=2.4GHz ssid=$WIFI_SSID wpa2"
timeout 60 "${SSH[@]}" \
  SSID="$WIFI_SSID" PW="$WIFI_PW" NET="$WIFI_NET" CC="$COUNTRY" 'sh -s' <<'REMOTE' 2>&1 | sed 's/^/    /'
set -e

# --- a dedicated network for the recovery AP -------------------------------
# NOT bridged to eth0. Bridging the recovery wifi onto eth0 would join it to
# the live WAN segment, which would be a very bad day.
uci set network.wifirec=interface
uci set network.wifirec.proto='static'
uci set network.wifirec.ipaddr="${NET}.1"
uci set network.wifirec.netmask='255.255.255.0'
uci commit network

# --- DHCP so a laptop just works when it joins ------------------------------
uci set dhcp.wifirec=dhcp
uci set dhcp.wifirec.interface='wifirec'
uci set dhcp.wifirec.start='100'
uci set dhcp.wifirec.limit='50'
uci set dhcp.wifirec.leasetime='12h'
uci commit dhcp

# --- the radio --------------------------------------------------------------
uci set wireless.radio0.disabled='0'
uci set wireless.radio0.country="$CC"
uci set wireless.radio0.band='2g'
uci set wireless.radio0.htmode='HT20'
# channel MUST be explicit. brcmfmac cannot do a channel survey, so
# channel='auto' makes hostapd fail with "ACS: All study options have failed"
# and the AP never starts. 6 is the middle non-overlapping 2.4GHz channel.
uci set wireless.radio0.channel='6'
# brcmfmac advertises Short Guard Interval and then rejects it when hostapd
# asks for it — "Driver does not support configured HT capability
# [SHORT-GI-40]" and the interface stays DISABLED. Turn both off.
uci set wireless.radio0.short_gi_40='0'
uci set wireless.radio0.short_gi_20='0'

# --- the access point: overwrite the open 'OpenWrt' default outright --------
uci set wireless.default_radio0.ssid="$SSID"
uci set wireless.default_radio0.encryption='psk2'
uci set wireless.default_radio0.key="$PW"
uci set wireless.default_radio0.network='wifirec'
uci set wireless.default_radio0.mode='ap'
uci commit wireless

# --- firewall: put it in the lan zone (input ACCEPT) so ssh+LuCI answer -----
zone=$(uci show firewall | sed -n "s/^firewall\.@zone\[\([0-9]*\)\]\.name='lan'/\1/p" | head -1)
if [ -n "$zone" ]; then
  uci add_list firewall.@zone[$zone].network='wifirec' 2>/dev/null || true
  uci commit firewall
  /etc/init.d/firewall reload >/dev/null 2>&1
fi

/etc/init.d/network reload >/dev/null 2>&1
sleep 3
wifi reload >/dev/null 2>&1
sleep 6

echo "radio disabled = $(uci get wireless.radio0.disabled)"
echo "ssid           = $(uci get wireless.default_radio0.ssid)"
echo "encryption     = $(uci get wireless.default_radio0.encryption)"
iw dev 2>/dev/null | grep -E "Interface|ssid|type" | sed 's/^\s*//'
ip -4 -br addr show wlan0 2>/dev/null || echo "wlan0 has no address yet"
REMOTE
guard "wifi configuration"
ok "recovery AP configured"

# =============================================================================
say "B. INERT mwan3 CONFIG  (before the package exists)"
step "writing /etc/config/mwan3 with everything disabled"
timeout 30 "${SSH[@]}" 'sh -s' <<'REMOTE' 2>&1 | sed 's/^/    /'
set -e
if [ -f /etc/config/mwan3 ]; then
  echo "already present, leaving it alone"
else
  cat > /etc/config/mwan3 <<'EOF'
# Seeded before installing mwan3 so the package cannot activate on install.
# opkg never overwrites an existing config file. Everything here is off; the
# real policies get written in Phase 5, once both ISPs are physically present.
config globals 'globals'
	option mmx_mask '0x3F00'
	option enabled '0'
EOF
  echo "seeded (globals.enabled = 0)"
fi
REMOTE
guard "mwan3 config seed"
ok "mwan3 will install dormant"

# =============================================================================
say "C. PACKAGES"
step "opkg update"
timeout 180 "${SSH[@]}" 'opkg update 2>&1 | tail -3' 2>&1 | sed 's/^/    /'
guard "opkg update"

# banip and adblock first — neither touches routing, so neither can strand us.
for p in banip luci-app-banip adblock luci-app-adblock; do
  step "installing $p"
  timeout 240 "${SSH[@]}" "opkg install $p 2>&1 | grep -viE '^(Configuring|Installing) ' | tail -4" 2>&1 | sed 's/^/    /'
  guard "install $p"
done

# mwan3 last, and immediately pinned shut.
step "installing mwan3 (then disabling it before it can run)"
timeout 240 "${SSH[@]}" '
  opkg install mwan3 luci-app-mwan3 2>&1 | tail -4
  /etc/init.d/mwan3 stop    >/dev/null 2>&1 || true
  /etc/init.d/mwan3 disable >/dev/null 2>&1 || true
  echo "mwan3 enabled at boot? $(/etc/init.d/mwan3 enabled && echo YES || echo no)"
' 2>&1 | sed 's/^/    /'
guard "mwan3 install"
ok "packages installed, mwan3 dormant"

# =============================================================================
say "D. PIN eth1/eth2 TO THEIR MAC ADDRESSES"
# USB devices are enumerated in whatever order the kernel finds them, so eth1
# and eth2 can trade places across a reboot — silently swapping which ISP is
# primary. Bind the name to something the hardware asserts about itself.
step "installing a hotplug rule"
timeout 40 "${SSH[@]}" 'sh -s' <<'REMOTE' 2>&1 | sed 's/^/    /'
set -e
mkdir -p /etc/hotplug.d/net
cat > /etc/hotplug.d/net/20-junior-nicnames <<'EOF'
# Pin the USB ethernet adapters to stable names by MAC address.
# Without this, eth1/eth2 can swap on reboot and the primary and backup ISP
# quietly change places — failover would still "work", against the wrong link.
[ "$ACTION" = "add" ] || exit 0
mac=$(cat /sys/class/net/$DEVICENAME/address 2>/dev/null)
case "$mac" in
  6c:6e:07:2d:9d:10) want=wan1 ;;
  6c:6e:07:2d:a4:c2) want=wan2 ;;
  *) exit 0 ;;
esac
[ "$DEVICENAME" = "$want" ] && exit 0
ip link set "$DEVICENAME" down 2>/dev/null
ip link set "$DEVICENAME" name "$want" 2>/dev/null
ip link set "$want" up 2>/dev/null
logger -t junior-nicnames "renamed $DEVICENAME ($mac) -> $want"
EOF
chmod +x /etc/hotplug.d/net/20-junior-nicnames
echo "written: /etc/hotplug.d/net/20-junior-nicnames"
echo "(applies on next hotplug event or reboot; current names left alone)"
REMOTE
guard "hotplug rule"
ok "names pinned to MACs"

# =============================================================================
say "E. FINAL STATE"
timeout 40 "${SSH[@]}" '
echo "--- interfaces ---"
ip -4 -br addr | grep -v "^lo"
echo "--- wifi ---"
iw dev 2>/dev/null | grep -E "Interface|ssid" | sed "s/^\s*//" || echo "(none up)"
echo "--- installed ---"
opkg list-installed 2>/dev/null | grep -iE "^mwan3|^banip|^adblock" | cut -d" " -f1 | paste -sd" " -
echo "--- mwan3 dormant? ---"
/etc/init.d/mwan3 enabled 2>/dev/null && echo "ENABLED (unexpected!)" || echo "disabled (correct)"
echo "--- overlay space ---"
df -h / | tail -1
echo "--- tunnel ---"
ip -4 -br addr show wg0
' 2>&1 | sed 's/^/    /'

cat <<EOF

────────────────────────────────────────────────────────────
  RECOVERY WI-FI  —  save this somewhere that isn't the Pi

      network   ${WIFI_SSID}
      password  ${WIFI_PW}
      the Pi    ${WIFI_NET}.1   (ssh root@${WIFI_NET}.1  ·  http://${WIFI_NET}.1)

  Join it from a phone or laptop and you can reach the Pi even
  when its internet, its LAN and the tunnel are all broken.
  Printed once. 2.4GHz, so it carries through walls and floors.
────────────────────────────────────────────────────────────

Phase 1 complete. Nothing about the current internet path changed.
Next: Armando runs a cable from the Xfinity gear to either USB adapter.
EOF
