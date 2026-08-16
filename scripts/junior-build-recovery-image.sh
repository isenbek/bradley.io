#!/usr/bin/env bash
# =============================================================================
# Build a FLASH-AND-GO recovery image for Armando's Pi 5 router.
#
# WHY
#   A config backup restores onto a working Pi. If the Pi (or its SD card) dies,
#   you want a card you can write and plug in — already the router, already on
#   the tunnel, already filtering. That is this image.
#
# WHAT GOES IN
#   - every /etc/config/* pulled live off the running router
#   - the MAC-pinning hotplug rule (without it the WAN names do not exist and
#     the baked network config refers to nothing)
#   - ssh authorized_keys, adblock/banip allowlists, /etc/sysupgrade.conf
#   - /etc/shadow, so the root password is the one you already know
#   - mwan3 / banip / adblock / nextdns / luci-app-commands preinstalled, so a
#     fresh card needs no internet to become the router
#
# WHAT IS DELIBERATELY LEFT OUT
#   The original 99-cb-rpi5 uci-defaults script. It rewrites network, firewall
#   and dropbear on first boot — which was right for a blank Pi and is now
#   actively harmful, because it would overwrite the very config we are baking.
#
# ⚠️  THIS IMAGE CONTAINS SECRETS: the WireGuard private key, the root password
#     hash, ssh host keys and the NextDNS profile ID. Treat it like a password.
#     Do not put it anywhere public.
#
# Run:  ./scripts/junior-build-recovery-image.sh
# =============================================================================
set -uo pipefail

BUILD="/mnt/ursa/build/openwrt-rpi5"
IB="${IB_DIR:-$BUILD/ib-fresh}"
STAGE="${STAGE:-/tmp/junior-recovery}"
OUT="$STAGE/out"
HOST="${HOST:-10.10.0.2}"
KEY="${KEY:-$HOME/.ssh/id_ed25519_cbrouter}"

SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=8
     -o IdentitiesOnly=yes -i "$KEY" "root@${HOST}")

say()  { printf '\n\033[1;36m══ %s\033[0m\n' "$*"; }
step() { printf '\033[1;34m ▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
bad()  { printf '\033[1;31m  x\033[0m %s\n' "$*"; }

[[ -d "$IB" ]] || { bad "imagebuilder not found at $IB"; exit 1; }

# ---------------------------------------------------------------- pull ------
say "PULLING LIVE CONFIG FROM THE ROUTER"
if ! timeout 20 "${SSH[@]}" true 2>/dev/null; then
  bad "cannot reach the Pi at $HOST — is the tunnel up?"
  exit 1
fi

rm -rf "$STAGE"
mkdir -p "$STAGE/files" "$OUT"

timeout 90 "${SSH[@]}" 'tar czf - \
    /etc/config \
    /etc/hotplug.d/net \
    /etc/dropbear/authorized_keys \
    /etc/adblock/adblock.allowlist \
    /etc/banip/banip.allowlist \
    /etc/sysupgrade.conf \
    /etc/shadow \
    2>/dev/null' > "$STAGE/live.tar.gz" 2>/dev/null

if [[ ! -s "$STAGE/live.tar.gz" ]]; then bad "config pull produced nothing"; exit 1; fi
tar xzf "$STAGE/live.tar.gz" -C "$STAGE/files"
ok "pulled $(find "$STAGE/files" -type f | wc -l) files"

# --- sanity: the pieces without which the image is worthless ----------------
for f in etc/config/network etc/config/firewall etc/config/dhcp \
         etc/hotplug.d/net/20-junior-nicnames etc/dropbear/authorized_keys; do
  if [[ -f "$STAGE/files/$f" ]]; then
    printf '    ✅ %s\n' "$f"
  else
    bad "MISSING $f — refusing to build an image that cannot route"
    exit 1
  fi
done

# --- permissions. The day-one bug: a group-writable /etc/dropbear makes
#     dropbear silently refuse every ssh key. Do not ship that again. --------
step "fixing permissions"
chmod 700 "$STAGE/files/etc/dropbear"
chmod 600 "$STAGE/files/etc/dropbear/authorized_keys"
chmod 600 "$STAGE/files/etc/shadow" 2>/dev/null || true
chmod 755 "$STAGE/files/etc/hotplug.d/net"
chmod 755 "$STAGE/files/etc/hotplug.d/net/"*
ok "dropbear dir is $(stat -c %a "$STAGE/files/etc/dropbear") (must be 700)"

# --- the old first-boot script must NOT come along -------------------------
if [[ -e "$STAGE/files/etc/uci-defaults/99-cb-rpi5" ]]; then
  rm -f "$STAGE/files/etc/uci-defaults/99-cb-rpi5"
  ok "removed the old first-boot script (it would overwrite the baked config)"
fi

# --- a marker so a future you can tell what this card is -------------------
mkdir -p "$STAGE/files/etc"
cat > "$STAGE/files/etc/junior-image-info" <<EOF
Recovery image for Armando's Pi 5 router.
Built from the LIVE configuration of the running router.
Config as of: $(timeout 15 "${SSH[@]}" 'date' 2>/dev/null || echo unknown)

On first boot this card IS the router:
  LAN            10.0.0.1/24, DHCP .20-.250
  WAN            wan2 (Xfinity), wan1 spare
  recovery wifi  pi-rescue -> 192.168.98.1
  recovery cable 192.168.99.1

Contains secrets (wireguard key, password hash, host keys). Treat accordingly.
EOF

# ---------------------------------------------------------------- build ----
say "BUILDING IMAGE"
# Mirrors the original image's package set, plus everything installed since.
PKGS="luci luci-ssl luci-app-firewall luci-app-package-manager \
luci-proto-wireguard wireguard-tools kmod-wireguard \
kmod-usb-net kmod-usb-net-asix-ax88179 kmod-usb-net-cdc-ether \
kmod-usb-net-cdc-ncm kmod-usb-net-rtl8152 \
wpad-basic-mbedtls wireless-regdb \
mwan3 luci-app-mwan3 \
banip luci-app-banip \
adblock luci-app-adblock \
nextdns luci-app-nextdns \
luci-app-commands"

step "packages: $(echo $PKGS | wc -w) requested"
step "this takes a few minutes..."

# A literal '~' or any relative entry in PATH makes GNU find refuse to run with
# -execdir, which the imagebuilder uses in prepare_rootfs. The interactive
# profile here has '~/.npm-global/bin' in PATH, so build with a clean one.
CLEAN_PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

( cd "$IB" && env PATH="$CLEAN_PATH" make image \
    PROFILE="rpi-5" \
    PACKAGES="$PKGS" \
    FILES="$STAGE/files" \
    BIN_DIR="$OUT" ) > "$STAGE/build.log" 2>&1

rc=$?
if [[ $rc -ne 0 ]]; then
  bad "build failed — last 25 lines:"
  tail -25 "$STAGE/build.log" | sed 's/^/    /'
  exit 1
fi

# ---------------------------------------------------------------- verify ---
say "RESULT"
IMG=$(ls "$OUT"/*squashfs-factory.img.gz 2>/dev/null | head -1)
if [[ -z "$IMG" ]]; then
  bad "no factory image produced"
  ls -la "$OUT" | sed 's/^/    /'
  exit 1
fi

ls -la "$OUT"/*.img.gz | awk '{printf "    %-72s %s\n", $NF, $5}'
echo
echo "    sha256:"
sha256sum "$OUT"/*factory.img.gz | sed 's/^/      /'

cat <<EOF

────────────────────────────────────────────────────────────
  FLASH THIS to a fresh SD card (Raspberry Pi Imager, or dd)
  and the new Pi comes up already being the router.

    $(basename "$IMG")

  Nothing to configure. It boots as 10.0.0.1, serves DHCP,
  filters DNS, and dials the tunnel home.

  ⚠️  Contains secrets. Keep it as private as a password.
────────────────────────────────────────────────────────────
EOF
